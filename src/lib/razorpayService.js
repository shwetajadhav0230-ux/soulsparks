export const RazorpayService = {
  loadScript: () => {
    return new Promise((resolve) => {
      console.log("RAZORPAY_DEBUG: Attempting to load SDK...");
      if (window.Razorpay) {
        console.log("RAZORPAY_DEBUG: SDK already present.");
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log("RAZORPAY_DEBUG: SDK loaded successfully.");
        resolve(true);
      };
      script.onerror = () => {
        console.error("RAZORPAY_DEBUG: SDK failed to load. Network error?");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  },

  openCheckout: async ({ user, amount, isAnnual, onSuccess, onCancel }) => {
    // We use the exact key you provided in your .env
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    
    console.log("RAZORPAY_DEBUG: Using Key ID:", keyId ? "Key Found" : "MISSING KEY");

    if (!keyId) {
      alert("CRITICAL ERROR: Razorpay Key not found in .env. Restart your terminal!");
      return;
    }

    const options = {
      key: keyId, 
      amount: Math.round(amount * 100), 
      currency: "INR",
      name: "SoulSpark Premium",
      description: isAnnual ? "Annual Pro Plan" : "Monthly Pro Plan",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=128&q=80",
      handler: function (response) {
        console.log("RAZORPAY_DEBUG: Payment Success ID:", response.razorpay_payment_id);
        onSuccess(response.razorpay_payment_id);
      },
      prefill: {
        name: user?.user_metadata?.full_name || "",
        email: user?.email || "",
      },
      theme: { color: "#10b981" },
      modal: {
        ondismiss: () => {
          console.log("RAZORPAY_DEBUG: Modal closed by user.");
          onCancel();
        }
      }
    };

    try {
      console.log("RAZORPAY_DEBUG: Initializing Modal...");
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("RAZORPAY_DEBUG: Failed to open modal:", err);
      alert("Checkout UI Error. Check console.");
    }
  }
};