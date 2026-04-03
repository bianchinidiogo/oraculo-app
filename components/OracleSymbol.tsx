import React from 'react';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

export type OracleLayerTransform = {
  opacity?: number;
  scale?: number;
  rotation?: number;
  translateX?: number;
  translateY?: number;
};

export type OracleSymbolProps = {
  size?: number;
  raysProps?: OracleLayerTransform;
  circlesProps?: OracleLayerTransform;
  innerGlowProps?: OracleLayerTransform;
  starProps?: OracleLayerTransform;
};

const VIEWBOX_SIZE = 340;
const CENTER = VIEWBOX_SIZE / 2;

function buildTransform({
  scale,
  rotation,
  translateX,
  translateY,
}: OracleLayerTransform = {}) {
  const transforms: string[] = [];

  if (translateX || translateY) {
    transforms.push(`translate(${translateX ?? 0} ${translateY ?? 0})`);
  }

  if (rotation) {
    transforms.push(`rotate(${rotation} ${CENTER} ${CENTER})`);
  }

  if (scale !== undefined) {
    transforms.push(
      `translate(${CENTER} ${CENTER}) scale(${scale}) translate(${-CENTER} ${-CENTER})`
    );
  }

  return transforms.join(' ');
}

function Layer({
  opacity,
  transform,
  children,
}: {
  opacity?: number;
  transform?: string;
  children: React.ReactNode;
}) {
  return (
    <G opacity={opacity ?? 1} transform={transform}>
      {children}
    </G>
  );
}

export default function OracleSymbol({
  size = 340,
  raysProps,
  circlesProps,
  innerGlowProps,
  starProps,
}: OracleSymbolProps) {
  return (
    <Svg viewBox="0 0 340 340" width={size} height={size}>
      <Defs>
        <RadialGradient
          id="oracleCoreGradient"
          cx="-83.1"
          cy="425.1"
          fx="-83.1"
          fy="425.1"
          r="0.7"
          gradientTransform="translate(5155 25675) scale(60 -60)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#805c19" />
          <Stop offset="0.28" stopColor="#f5dbab" stopOpacity="0.96" />
          <Stop offset="0.58" stopColor="#eebe66" stopOpacity="0.32" />
          <Stop offset="1" stopColor="#ffdfa4" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient id="oracleAuraGradient" cx="50%" cy="50%" r="60%">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
          <Stop offset="0.45" stopColor="#a9dfff" stopOpacity="0.1" />
          <Stop offset="1" stopColor="#57bfff" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Layer opacity={raysProps?.opacity} transform={buildTransform(raysProps)}>
        <Line x1="170.3" y1="325.2" x2="170.3" y2="244.2" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="140" y1="322.2" x2="155.8" y2="242.8" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="111" y1="313.4" x2="142" y2="238.6" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="84.2" y1="299.1" x2="129.2" y2="231.7" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="60.7" y1="279.8" x2="117.9" y2="222.5" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="41.4" y1="256.3" x2="108.7" y2="211.3" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="27.1" y1="229.5" x2="101.9" y2="198.5" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="18.3" y1="200.4" x2="97.7" y2="184.6" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="15.3" y1="170.2" x2="96.3" y2="170.2" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="18.3" y1="139.9" x2="97.7" y2="155.7" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="27.1" y1="110.9" x2="101.9" y2="141.9" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="41.4" y1="84.1" x2="108.7" y2="129.1" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="60.7" y1="60.6" x2="117.9" y2="117.8" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="84.2" y1="41.3" x2="129.2" y2="108.6" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="111" y1="27" x2="142" y2="101.8" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="140" y1="18.2" x2="155.8" y2="97.6" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="170.3" y1="15.2" x2="170.3" y2="96.2" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="200.5" y1="18.2" x2="184.7" y2="97.6" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="229.6" y1="27" x2="198.6" y2="101.8" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="256.4" y1="41.3" x2="211.4" y2="108.6" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="279.9" y1="60.6" x2="222.6" y2="117.8" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="299.2" y1="84.1" x2="231.8" y2="129.1" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="313.5" y1="110.9" x2="238.7" y2="141.9" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="322.3" y1="139.9" x2="242.9" y2="155.7" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="325.3" y1="170.2" x2="244.3" y2="170.2" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="322.3" y1="200.4" x2="242.9" y2="184.6" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="313.5" y1="229.5" x2="238.7" y2="198.5" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="299.2" y1="256.3" x2="231.8" y2="211.3" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="279.9" y1="279.8" x2="222.6" y2="222.5" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="256.4" y1="299.1" x2="211.4" y2="231.7" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="229.6" y1="313.4" x2="198.6" y2="238.6" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
        <Line x1="200.5" y1="322.2" x2="184.7" y2="242.8" stroke="#ffd8ef" strokeWidth="1" opacity="0.08" />
      </Layer>

      <Layer opacity={circlesProps?.opacity} transform={buildTransform(circlesProps)}>
        <Circle cx="170.3" cy="170.2" r="130" fill="url(#oracleAuraGradient)" opacity="0.25" />
        <Circle cx="170.3" cy="170.2" r="74" fill="none" stroke="#ffcd93" strokeWidth="1.2" opacity="0.24" />
        <Circle cx="170.3" cy="170.2" r="58" fill="none" stroke="#ffcd93" strokeWidth="1" opacity="0.18" />
        <Circle cx="170.3" cy="170.2" r="48" fill="none" stroke="#ffcd93" strokeWidth="1" opacity="0.10" />
        <Circle cx="170.3" cy="170.2" r="66" fill="none" stroke="#ffcd93" strokeWidth="1" opacity="0.08" />
      </Layer>

      <Layer opacity={innerGlowProps?.opacity} transform={buildTransform(innerGlowProps)}>
        <Circle cx="170.3" cy="170.2" r="34" fill="url(#oracleCoreGradient)" />
      </Layer>

      <Layer opacity={starProps?.opacity} transform={buildTransform(starProps)}>
        <Line x1="170.3" y1="136.2" x2="170.3" y2="204.2" stroke="#ffeece" strokeWidth="1.4" />
        <Line x1="136.3" y1="170.2" x2="204.3" y2="170.2" stroke="#ffeece" strokeWidth="1.4" />
        <Path
          d="M170.3,136.2c14.7,22.7,14.7,45.3,0,68-14.7-22.7-14.7-45.3,0-68"
          fill="none"
          stroke="#ffeece"
          strokeWidth="1.2"
        />
        <Path
          d="M136.3,170.2c22.7-14.7,45.3-14.7,68,0-22.7,14.7-45.3,14.7-68,0"
          fill="none"
          stroke="#ffeece"
          strokeWidth="1.2"
        />
        <Circle cx="170.3" cy="170.2" r="36" fill="none" stroke="#fcdfab" strokeWidth="6" opacity="0.08" />
        <Circle cx="170.3" cy="170.2" r="34" fill="none" stroke="#ffed9f" strokeWidth="1.6" />
      </Layer>
    </Svg>
  );
}