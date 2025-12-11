import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./signin.css";

function SigninPage({ setUser }) {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      alert("Please enter a valid phone number.");
      return;
    }
    setOtpSent(true);
    alert(`Mock OTP sent to ${phone}`);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      alert("Please enter the 6-digit OTP.");
      return;
    }
    setVerified(true);
    alert("Phone number verified (mock)!");
  };

  const handleSubmitDetails = () => {
    if (!name || !gender || !email) {
      alert("Please fill all the fields.");
      return;
    }
    setUser && setUser({ name, gender, email, phone });
    navigate("/");
  };

  return (
    <div className="signin-container">
      <h2>Sign in with your phone number</h2>

      {!verified && (
        <>
          <PhoneInput
            international
            defaultCountry="IN"
            value={phone}
            onChange={setPhone}
            placeholder="Enter phone number"
          />
          {!otpSent ? (
            <button onClick={handleSendOtp} className="btn-primary" style={{ marginTop: 20 }}>
              Send OTP
            </button>
          ) : (
            <>
              <input
                type="text"
                maxLength={6}
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="otp-input"
                style={{ marginTop: 20 }}
              />
              <button onClick={handleVerifyOtp} className="btn-primary" style={{ marginTop: 10 }}>
                Verify OTP
              </button>
            </>
          )}
        </>
      )}

      {verified && (
        <div className="details-form">
          <h3>Additional Details</h3>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="details-input"
          />
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            className="details-input"
          >
            <option value="" disabled>
              Select Gender
            </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="details-input"
          />
          <button onClick={handleSubmitDetails} className="btn-primary" style={{ marginTop: 20 }}>
            Submit Details
          </button>
        </div>
      )}
    </div>
  );
}

export default SigninPage;
