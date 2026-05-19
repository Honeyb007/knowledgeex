// Shared wallet connection utility
async function connectAndSaveWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert("Please install MetaMask!");
        return null;
    }

    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        // Save to backend
        const token = localStorage.getItem('token');
        await fetch('http://localhost:5000/api/auth/save-wallet', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ walletAddress: address })
        });

        // Update localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        user.walletAddress = address;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('walletAddress', address);

        return { provider, signer, address };
    } catch (err) {
        console.error(err);
        alert("Failed to connect wallet: " + err.message);
        return null;
    }
}