import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

interface WheelLetterProps {
  letter: string;
  color: string;
  angle: number;
  radius: number;
}

const WheelLetter = ({ letter, color, angle, radius }: WheelLetterProps) => {
  const x = 0;
  const y = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  return (
    <group position={[x, y, z]} rotation={[angle, 0, 0]}>
      <Text
        fontSize={1.8}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff"
        fontWeight={700}
      >
        {letter}
      </Text>
      {/* ASCII-style border lines around the letter */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(2.2, 2.4)]} />
        <lineBasicMaterial color={color} transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
};

interface WheelProps {
  targetIndex: number;
}

const Wheel = ({ targetIndex }: WheelProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);

  const items = useMemo(
    () => [
      { letter: "K", color: "#4ae04a" },  // ansi-green
      { letter: "N", color: "#e04ae0" },  // ansi-magenta
      { letter: "E", color: "#4a9fe0" },  // ansi-blue
    ],
    []
  );

  const angleStep = (Math.PI * 2) / items.length;

  useFrame(() => {
    if (!groupRef.current) return;
    const targetRotation = targetIndex * angleStep;
    currentRotation.current += (targetRotation - currentRotation.current) * 0.08;
    groupRef.current.rotation.x = -currentRotation.current;
  });

  return (
    <group ref={groupRef}>
      {items.map((item, i) => (
        <WheelLetter
          key={item.letter}
          letter={item.letter}
          color={item.color}
          angle={i * angleStep}
          radius={2.5}
        />
      ))}
    </group>
  );
};

interface CvWheelProps {
  currentIndex: number;
}

const CvWheel = ({ currentIndex }: CvWheelProps) => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={0.8} />
        <Wheel targetIndex={currentIndex} />
      </Canvas>
    </div>
  );
};

export default CvWheel;
