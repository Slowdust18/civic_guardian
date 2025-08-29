import React from "react";
import { useNavigate } from "react-router-dom";

function MainButtons({ isLoggedIn }) {
  const navigate = useNavigate();

  const buttonStyle = {
    margin: "10px",
    padding: "15px 25px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "white",
    backgroundColor: "#e57f11ff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  };

  return (
    <div>
      {/* Report Issue button - always enabled */}
      <button style={buttonStyle} onClick={() => navigate("/complaint")}>
  Report Issue
</button>

      {/* User Login button - always disabled / greyed out */}
      <button
        style={{
          ...buttonStyle,
          opacity: 0.5,
          cursor: "not-allowed",
        }}
        disabled
      >
        User Login
      </button>

      {/* View Map button */}
      <button style={buttonStyle} onClick={() => navigate("/map")}>
        View Map
      </button>
    </div>
  );
}

export default MainButtons;
