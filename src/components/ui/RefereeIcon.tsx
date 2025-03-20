const RefereeIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="-5 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-4,0)">
      {/* Yellow Card */}
      <rect x="5" y="4" width="10" height="14" transform="rotate(-10 5 4)" fill="yellow" stroke="black" strokeWidth="1"/>
      {/* Red Card */}
      <rect x="9" y="6" width="10" height="14" transform="rotate(10 9 6)" fill="red" stroke="black" strokeWidth="1"/>
    </g>
  </svg>
);

export default RefereeIcon;
