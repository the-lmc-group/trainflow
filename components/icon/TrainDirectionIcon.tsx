export const TrainDirectionIcon = ({
  size = 24,
  color = "currentColor",
  rotation = 0,
}: {
  size?: number;
  color?: string;
  rotation?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ transform: `rotate(${rotation}deg)` }}
    fill={color}
  >
    <path
      d="
        M12 2
        C6.48 2 2 6.48 2 12
        C2 17.52 6.48 22 12 22
        C17.52 22 22 17.52 22 12
        C22 6.48 17.52 2 12 2
        Z

        M13.8 7.5
        C14.1 7.2 14.6 7.4 14.6 7.85
        V10.2
        C14.6 10.5 14.75 10.8 15 11
        L17.3 12
        L15 13
        C14.75 13.2 14.6 13.5 14.6 13.8
        V16.15
        C14.6 16.6 14.1 16.8 13.8 16.5
        L9.2 12
        L13.8 7.5
        Z
      "
    />
  </svg>
);
