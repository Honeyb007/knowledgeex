const Booking = require("../models/Booking");
const TutorProfile = require("../models/TutorProfile");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const parseAvailabilityRule = (availability) => {
  if (!availability) return null;
  const text = availability.toLowerCase();
  const rule = { days: null, startMinutes: null, endMinutes: null };

  if (/weekdays/.test(text)) {
    rule.days = [1, 2, 3, 4, 5];
  } else if (/weekends/.test(text)) {
    rule.days = [0, 6];
  } else if (/daily|every day|any day/.test(text)) {
    rule.days = [0, 1, 2, 3, 4, 5, 6];
  } else {
    const dayNames = {
      sunday: 0, sun: 0,
      monday: 1, mon: 1,
      tuesday: 2, tue: 2, tues: 2,
      wednesday: 3, wed: 3,
      thursday: 4, thu: 4, thurs: 4,
      friday: 5, fri: 5,
      saturday: 6, sat: 6,
    };
    const days = [];
    Object.keys(dayNames).forEach((day) => {
      if (new RegExp(`\\b${day}\\b`).test(text)) {
        days.push(dayNames[day]);
      }
    });
    if (days.length) rule.days = [...new Set(days)].sort();
  }

  const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(am|pm)?)[\s–\-to]+(\d{1,2}(?::\d{2})?\s*(am|pm)?)/i);
  if (timeMatch) {
    const parseTime = (token) => {
      const parts = token.trim().toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (!parts) return null;
      let hour = parseInt(parts[1], 10);
      const minute = parseInt(parts[2] || '0', 10);
      const meridiem = parts[3];
      if (meridiem) {
        if (meridiem === 'pm' && hour !== 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
      }
      return hour * 60 + minute;
    };
    rule.startMinutes = parseTime(timeMatch[1]);
    rule.endMinutes   = parseTime(timeMatch[3]);
  }

  return rule;
};

const validateDateAgainstAvailability = (date, duration, availability) => {
  if (!availability) return null;
  const rule = parseAvailabilityRule(availability);
  if (!rule) return null;

  if (rule.days && !rule.days.includes(date.getDay())) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const allowed = rule.days.map((d) => dayNames[d]).join(', ');
    return `Tutor is only available on ${allowed}.`;
  }

  if (rule.startMinutes !== null && rule.endMinutes !== null) {
    const bookingStart = date.getHours() * 60 + date.getMinutes();
    const bookingEnd = bookingStart + duration * 60;
    if (bookingStart < rule.startMinutes || bookingEnd > rule.endMinutes) {
      const pad = (n) => n.toString().padStart(2, '0');
      const startHours = Math.floor(rule.startMinutes / 60);
      const startMinutes = rule.startMinutes % 60;
      const endHours = Math.floor(rule.endMinutes / 60);
      const endMinutes = rule.endMinutes % 60;
      return `Tutor is available between ${startHours}:${pad(startMinutes)} and ${endHours}:${pad(endMinutes)}.`;
    }
  }

  return null;
};

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Send notification email
const sendNotificationEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"KnowledgeEx" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Email sending failed:", error);
  }
};
// Generate Google Calendar link
const generateCalendarLink = (booking, tutorName, learnerName, duration) => {
    const start = new Date(booking.scheduledAt);
    const end = new Date(start.getTime() + (duration || 1) * 60 * 60 * 1000);

    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d{3}/g, '');

    const title = encodeURIComponent(`KnowledgeEx: ${booking.subject}`);
    const details = encodeURIComponent(
        `Tutoring session on ${booking.subject}\n\nTutor: ${tutorName}\nLearner: ${learnerName}\nAmount: ${booking.amount} ETH\n\nPowered by KnowledgeEx`
    );
    const location = encodeURIComponent('Federal University of Lafia, Nasarawa State');
    const dates = `${formatDate(start)}/${formatDate(end)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
};
const createBooking = async (req, res) => {
    try {
        if (req.user.role !== "learner") {
            return res.status(403).json({ message: "Only learners can book sessions" });
        }

        const { tutorProfileId, subject, message, scheduledAt, duration } = req.body;

        const tutorProfile = await TutorProfile.findById(tutorProfileId).populate("user", "firstName lastName email");
        if (!tutorProfile) {
            return res.status(404).json({ message: "Tutor not found" });
        }

        const learner = await User.findById(req.user.id).select("firstName lastName email");
        if (!learner) {
            return res.status(404).json({ message: "Learner not found" });
        }

        const scheduledDate = new Date(scheduledAt);
        if (Number.isNaN(scheduledDate.getTime())) {
            return res.status(400).json({ message: "Invalid scheduled date." });
        }

        const sessionDuration = duration || 1;
        const availabilityError = validateDateAgainstAvailability(scheduledDate, sessionDuration, tutorProfile.availability);
        if (availabilityError) {
            return res.status(400).json({ message: availabilityError });
        }

        const totalAmount = tutorProfile.hourlyRate * sessionDuration;

        const booking = await Booking.create({
            learner: req.user.id,
            tutor: tutorProfile.user._id,
            tutorProfile: tutorProfileId,
            subject,
            message,
            scheduledAt: scheduledDate,
            amount: totalAmount,
            duration: sessionDuration,
        });

        const scheduledDateString = scheduledDate.toLocaleString();
        const calendarLinkForTutor = generateCalendarLink(
            booking,
            `${tutorProfile.user.firstName} ${tutorProfile.user.lastName}`,
            `${learner.firstName} ${learner.lastName}`,
            sessionDuration
        );

        await sendNotificationEmail(
            tutorProfile.user.email,
            "New Session Booking Request - KnowledgeEx",
            `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Session Booking Request</h2>
          <p>Hi ${tutorProfile.user.firstName},</p>
          <p>You have received a new session booking request from <strong>${learner.firstName} ${learner.lastName}</strong>.</p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Booking Details:</h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Scheduled:</strong> ${scheduledDateString}</p>
            <p><strong>Rate:</strong> ${tutorProfile.hourlyRate} ETH</p>
            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          </div>
          <p>Add this to your calendar to stay on schedule!</p>
          <a href="${calendarLinkForTutor}" target="_blank" style="display:inline-block; margin-top:8px; margin-bottom:16px; padding:12px 24px; background:#4285f4; color:white; border-radius:8px; text-decoration:none; font-weight:600;">
              📅 Add to Google Calendar
          </a>

          <p>Please log in to your dashboard to accept or decline this booking.</p>
          <a href="${process.env.CLIENT_URL}/tutor_dashboard.html" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#2563eb; color:white; border-radius:8px; text-decoration:none; font-weight:600;">View Dashboard</a>
        </div>
      `
        );

        res.status(201).json({ message: "Booking created", booking });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET MY BOOKINGS (Learner sees their bookings)
const getLearnerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ learner: req.user.id })
      .populate("tutor", "firstName lastName")
      .populate("tutorProfile", "courses hourlyRate")
      .populate("feedback")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET TUTOR REQUESTS (Tutor sees incoming bookings)
const getTutorBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ tutor: req.user.id })
      .populate("learner", "firstName lastName department level")
      .populate("tutorProfile", "courses hourlyRate")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ACCEPT BOOKING (Tutor accepts)
const acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("learner", "firstName lastName email")
      .populate("tutor", "firstName lastName")
      .populate("tutorProfile", "courses");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.tutor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Booking is no longer pending" });
    }

    booking.status = "scheduled";
    await booking.save();

    // Send email notification to learner
    
    const scheduledDateString = new Date(booking.scheduledAt).toLocaleString();
    const calendarLink = generateCalendarLink(
    booking,
    `${booking.tutor.firstName} ${booking.tutor.lastName}`,
    `${booking.learner.firstName} ${booking.learner.lastName}`,
    booking.duration || 1
);

await sendNotificationEmail(
    booking.learner.email,
    "Session Booking Accepted - KnowledgeEx",
    `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Session Booking Accepted! 🎉</h2>
        <p>Hi ${booking.learner.firstName},</p>
        <p>Great news! <strong>${booking.tutor.firstName} ${booking.tutor.lastName}</strong> has accepted your session booking request.</p>

        <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #1f2937;">Session Details:</h3>
            <p><strong>Subject:</strong> ${booking.subject}</p>
            <p><strong>Tutor:</strong> ${booking.tutor.firstName} ${booking.tutor.lastName}</p>
            <p><strong>Scheduled:</strong> ${scheduledDateString}</p>
            <p><strong>Duration:</strong> ${booking.duration || 1} hour(s)</p>
            <p><strong>Amount:</strong> ${booking.amount} ETH</p>
            ${booking.message ? `<p><strong>Your Message:</strong> ${booking.message}</p>` : ''}
        </div>

        <p>Add this session to your Google Calendar so you don't miss it!</p>

        <a href="${calendarLink}" target="_blank" style="display:inline-block; margin-top:8px; margin-bottom:16px; padding:12px 24px; background:#4285f4; color:white; border-radius:8px; text-decoration:none; font-weight:600;">
            📅 Add to Google Calendar
        </a>

        <p>Funds have been locked in escrow and will be released to the tutor after the session is completed.</p>
        <a href="${process.env.CLIENT_URL}/dashboard.html" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#2563eb; color:white; border-radius:8px; text-decoration:none; font-weight:600;">View Dashboard</a>
    </div>
    `
);

    res.status(200).json({ message: "Booking accepted", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DECLINE BOOKING (Tutor declines)
const declineBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("learner", "firstName lastName email")
      .populate("tutor", "firstName lastName");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.tutor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Booking is no longer pending" });
    }

    booking.status = "declined";
    await booking.save();

    // Send email notification to learner
    await sendNotificationEmail(
      booking.learner.email,
      "Session Booking Declined - KnowledgeEx",
      `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Session Booking Declined</h2>
          <p>Hi ${booking.learner.firstName},</p>
          <p>We regret to inform you that <strong>${booking.tutor.firstName} ${booking.tutor.lastName}</strong> has declined your session booking request.</p>

          <div style="background: #fef2f2; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h3 style="margin-top: 0; color: #1f2937;">Booking Details:</h3>
            <p><strong>Subject:</strong> ${booking.subject}</p>
            <p><strong>Requested Time:</strong> ${new Date(booking.scheduledAt).toLocaleString('en-US')}</p>
            <p><strong>Rate:</strong> ${booking.amount} ETH</p>
            ${booking.message ? `<p><strong>Your Message:</strong> ${booking.message}</p>` : ''}
          </div>

          <p>Don't worry! You can browse other tutors and book a new session. Your funds have been returned to your wallet.</p>
          <a href="${process.env.CLIENT_URL}/marketplace.html" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#2563eb; color:white; border-radius:8px; text-decoration:none; font-weight:600;">Find Another Tutor</a>
        </div>
      `
    );

    res.status(200).json({ message: "Booking declined", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// MARK AS COMPLETE (Tutor marks session done)
const markComplete = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("learner", "firstName lastName email")
      .populate("tutor", "firstName lastName");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.tutor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (booking.status !== "scheduled") {
      return res.status(400).json({ message: "Session is not scheduled" });
    }
    // Check if session time has passed
    const now = new Date();
    const sessionTime = new Date(booking.scheduledAt);
    if (now < sessionTime) {
        return res.status(400).json({ 
            message: `Session is scheduled for ${sessionTime.toLocaleString('en-US', { weekday:'long', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}. You cannot mark it complete before the session time.` 
        });
    }

    booking.status = "awaiting_confirmation";
    await booking.save();

    // Send email notification to learner
    await sendNotificationEmail(
      booking.learner.email,
      "Session Completed - Awaiting Your Confirmation - KnowledgeEx",
      `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Session Completed! ⏰</h2>
          <p>Hi ${booking.learner.firstName},</p>
          <p><strong>${booking.tutor.firstName} ${booking.tutor.lastName}</strong> has marked your session as completed.</p>

          <div style="background: #fffbeb; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #1f2937;">Session Details:</h3>
            <p><strong>Subject:</strong> ${booking.subject}</p>
            <p><strong>Tutor:</strong> ${booking.tutor.firstName} ${booking.tutor.lastName}</p>
            <p><strong>Amount:</strong> ${booking.amount} ETH</p>
          </div>

          <p>Please confirm that the session was completed satisfactorily. Once you confirm, the payment will be released to the tutor.</p>
          <p>If you have any issues with the session, please contact support.</p>
          <a href="${process.env.CLIENT_URL}/sessions.html" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#2563eb; color:white; border-radius:8px; text-decoration:none; font-weight:600;">Confirm Session</a>
        </div>
      `
    );

    res.status(200).json({ message: "Session marked complete, waiting for learner confirmation", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// CONFIRM & RELEASE PAYMENT (Learner confirms session)
const confirmSession = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("learner", "firstName lastName email")
      .populate("tutor", "firstName lastName email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.learner._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (booking.status !== "awaiting_confirmation") {
      return res.status(400).json({ message: "Session is not awaiting confirmation" });
    }

    const { txHash } = req.body;

    booking.status = "completed";
    booking.txHash = txHash || "";
    await booking.save();

    // Update tutor's total sessions
    await TutorProfile.findOneAndUpdate(
      { user: booking.tutor._id },
      { $inc: { totalSessions: 1 } }
    );

    // Send email notification to tutor
    await sendNotificationEmail(
      booking.tutor.email,
      "Payment Released - Session Confirmed - KnowledgeEx",
      `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Payment Released! 💰</h2>
          <p>Hi ${booking.tutor.firstName},</p>
          <p>Great news! <strong>${booking.learner.firstName} ${booking.learner.lastName}</strong> has confirmed the session completion.</p>

          <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #1f2937;">Session Details:</h3>
            <p><strong>Subject:</strong> ${booking.subject}</p>
            <p><strong>Learner:</strong> ${booking.learner.firstName} ${booking.learner.lastName}</p>
            <p><strong>Amount Earned:</strong> ${booking.amount} ETH</p>
            ${booking.txHash ? `<p><strong>Transaction:</strong> <a href="https://etherscan.io/tx/${booking.txHash}" style="color:#2563eb;">${booking.txHash}</a></p>` : ''}
          </div>

          <p>The payment has been released from escrow to your wallet. You can view your earnings in the wallet section.</p>
          <a href="${process.env.CLIENT_URL}/wallet.html" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#2563eb; color:white; border-radius:8px; text-decoration:none; font-weight:600;">View Earnings</a>
        </div>
      `
    );

    res.status(200).json({ message: "Session confirmed, payment released!", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// FUND BOOKING (save txHash after escrow payment)
const fundBooking = async (req, res) => {
    try {
        const { txHash } = req.body;

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.learner.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        booking.txHash = txHash;
        await booking.save();

        res.status(200).json({ message: "Booking funded", booking });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
// CANCEL BOOKING (if MetaMask rejected)
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.learner.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ message: "Can only cancel pending bookings" });
        }

        await Booking.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Booking cancelled" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
// REFUND BOOKING
const refundBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("learner", "firstName lastName email")
            .populate("tutor", "firstName lastName");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.learner._id.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const { txHash } = req.body;
        booking.status = 'refunded';
        booking.txHash = txHash || "";
        await booking.save();

        // Notify learner
        await sendNotificationEmail(
            booking.learner.email,
            "Refund Processed - KnowledgeEx",
            `
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Refund Processed </h2>
                <p>Hi ${booking.learner.firstName},</p>
                <p>Your refund for the session <strong>${booking.subject}</strong> has been processed successfully.</p>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <p><strong>Amount Refunded:</strong> ${booking.amount} ETH</p>
                    ${txHash ? `<p><strong>Transaction:</strong> <a href="https://sepolia.etherscan.io/tx/${txHash}" style="color:#2563eb;">${txHash.substring(0,20)}...</a></p>` : ''}
                </div>
                <p>The ETH has been returned to your wallet.</p>
                <a href="${process.env.CLIENT_URL}/marketplace.html" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#2563eb; color:white; border-radius:8px; text-decoration:none; font-weight:600;">Find Another Tutor</a>
            </div>
            `
        );

        res.status(200).json({ message: "Booking refunded", booking });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
  createBooking,
  getLearnerBookings,
  getTutorBookings,
  acceptBooking,
  declineBooking,
  markComplete,
  confirmSession,
  fundBooking,
  cancelBooking,
  refundBooking
};