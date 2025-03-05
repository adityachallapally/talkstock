import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";

export const TitleFrame: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Single animation for both title and subtitle
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const nameOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        position: "relative",
      }}
    >
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        position: "absolute",
        top: "10%",
        transform: "translateY(0)",
        gap: "20px",
      }}>
        <Sequence from={0}>
          <div style={{ opacity: titleOpacity, width: "100%", textAlign: "center" }}>
            <div style={{
              backgroundColor: "#ff0000",
              color: "white",
              padding: "10px 30px",
              fontSize: "64px",
              fontWeight: "bold",
              display: "inline-block",
              marginBottom: "20px",
            }}>
              MISTAKE
            </div>
            
            <div style={{
              color: "white",
              fontSize: "48px",
              fontWeight: "bold",
              lineHeight: 1.2,
              padding: "20px 0",
            }}>
              Adopting Overly<br />
              Complicated AI Systems
            </div>
          </div>
        </Sequence>
      </div>

      {/* Name section */}
      <Sequence from={40}>
        <div style={{
          position: "absolute",
          bottom: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          opacity: nameOpacity,
          width: "100%",
        }}>
          <div
            style={{
              backgroundColor: "#ff0000",
              color: "white",
              padding: "5px 15px",
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            YOUR NAME HERE
          </div>
          <div
            style={{
              color: "black",
              fontSize: "16px",
              fontWeight: "medium",
            }}
          >
            POSITION TITLE HERE
          </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};