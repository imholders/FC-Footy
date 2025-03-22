const FastForwardIcon: React.FC<{ size?: number; color?: string }> = ({
    size = 22,
    color = "#fff", // Dark gray/black tone
  }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* First Triangle */}
      <polygon points="3,4 12,12 3,20" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      
      {/* Second Triangle */}
      <polygon points="11,4 20,12 11,20" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  
       </svg>
  );
  
  export default FastForwardIcon;
  