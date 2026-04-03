import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);
const AnimatedView = Animated.createAnimatedComponent(View);

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  'worklet';
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export default function OraculoRitualScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const centerX = screenWidth / 2;
  const centerY = screenHeight * 0.56;

  const pulse = useSharedValue(0);
  const aura = useSharedValue(0);
  const slowRotate = useSharedValue(0);
  const reverseRotate = useSharedValue(0);
  const symbolGlow = useSharedValue(0);
  const flash = useSharedValue(0);
  const reveal = useSharedValue(0);
  const energyBurst = useSharedValue(0);
  const ritualWave = useSharedValue(0);
  const veilOpacity = useSharedValue(0.38);

  const [revealed, setRevealed] = useState(false);

  // Ajuste se o vídeo tiver outra proporção
  const videoAspectRatio = 9 / 16;
  const maxFrameHeight = screenHeight;
  const maxFrameWidth = screenWidth;

  let frameWidth = Math.min(maxFrameWidth, maxFrameHeight * videoAspectRatio);
  let frameHeight = frameWidth / videoAspectRatio;

  if (frameHeight > maxFrameHeight) {
    frameHeight = maxFrameHeight;
    frameWidth = frameHeight * videoAspectRatio;
  }

const [videoReady, setVideoReady] = useState(false);

const player = useVideoPlayer(require('../assets/videos/oraculo-bg.mp4'));

useEffect(() => {
  player.loop = true;
  player.muted = true;
  player.play();
}, [player]);

const { status } = useEvent(player, 'statusChange', {
  status: player.status,
});



  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    aura.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 6500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.15, { duration: 6500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    symbolGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.35, { duration: 2800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    slowRotate.value = withRepeat(
      withTiming(360, { duration: 32000, easing: Easing.linear }),
      -1,
      false
    );

    reverseRotate.value = withRepeat(
      withTiming(-360, { duration: 48000, easing: Easing.linear }),
      -1,
      false
    );

    ritualWave.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const onRitualDone = () => setRevealed(true);

  const handlePress = () => {
    setRevealed(false);

    cancelAnimation(flash);
    cancelAnimation(reveal);
    cancelAnimation(energyBurst);
    cancelAnimation(veilOpacity);

    flash.value = 0;
    reveal.value = 0;
    energyBurst.value = 0;

    veilOpacity.value = withSequence(
      withTiming(0.5, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      withDelay(
        1200,
        withTiming(0.25, { duration: 1400, easing: Easing.out(Easing.cubic) })
      )
    );

    energyBurst.value = withSequence(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) }),
      withTiming(0.4, { duration: 1800, easing: Easing.inOut(Easing.quad) })
    );

    flash.value = withSequence(
      withDelay(
        900,
        withTiming(0.8, { duration: 700, easing: Easing.out(Easing.quad) })
      ),
      withTiming(0.25, { duration: 800, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.quad) })
    );

    reveal.value = withDelay(
      2200,
      withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }, () => {
        runOnJS(onRitualDone)();
      })
    );
  };

  const bgAuraProps = useAnimatedProps(() => ({
    r: 130 + pulse.value * 20 + energyBurst.value * 32,
    opacity: 0.14 + aura.value * 0.18 + energyBurst.value * 0.15,
  }));

  const haloProps = useAnimatedProps(() => ({
    r: 72 + aura.value * 10 + energyBurst.value * 8,
    opacity: 0.18 + aura.value * 0.14,
  }));

  const coreProps = useAnimatedProps(() => ({
    r: 34 + pulse.value * 5 + energyBurst.value * 10,
    opacity: 0.96,
  }));

const rotatingOuterProps = useAnimatedProps(() => ({
  transform: [
    {
      rotate: `${slowRotate.value}deg`,
    },
  ],
  opacity: 0.42 + energyBurst.value * 0.2,
}));

const rotatingInnerProps = useAnimatedProps(() => ({
  transform: [
    {
      rotate: `${reverseRotate.value}deg`,
    },
  ],
  opacity: 0.28 + energyBurst.value * 0.16,
}));

const glyphProps = useAnimatedProps(() => ({
  opacity: 0.82 + symbolGlow.value * 0.12 + energyBurst.value * 0.06,
}));

  const messageProps = useAnimatedProps(() => ({
    opacity: reveal.value,
  }));

  const subtitleProps = useAnimatedProps(() => ({
    opacity: reveal.value * 0.65,
  }));

  const veilStyle = useAnimatedStyle(() => ({
    opacity: veilOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.videoLayer} pointerEvents="none">
        <View
          style={[
            styles.videoFrame,
            {
              width: frameWidth,
              height: frameHeight,
            },
          ]}
        >
<VideoView
  style={styles.video}
  player={player}
  contentFit="contain"
  nativeControls={false}
  surfaceType="textureView"
  useExoShutter={false}
/>
        </View>
      </View>

      <AnimatedView style={[styles.videoVeil, veilStyle]} />

      <Pressable style={StyleSheet.absoluteFill} onPress={handlePress}>
        <Svg width={screenWidth} height={screenHeight}>
          <Defs>
            <RadialGradient id="bgGlow" cx="50%" cy="56%" r="70%">
              <Stop offset="0%" stopColor="#13385b" stopOpacity="0.55" />
              <Stop offset="38%" stopColor="#0b1f38" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#040916" stopOpacity="0.92" />
            </RadialGradient>

            <RadialGradient id="coreGradient" cx="50%" cy="50%" r="60%">
              <Stop offset="0%" stopColor="#805c19" stopOpacity="1" />
              <Stop offset="28%" stopColor="#f5dbab" stopOpacity="0.96" />
              <Stop offset="58%" stopColor="#eebe66" stopOpacity="0.32" />
              <Stop offset="100%" stopColor="#ffdfa4" stopOpacity="0" />
            </RadialGradient>

            <RadialGradient id="auraGradient" cx="50%" cy="50%" r="60%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
              <Stop offset="45%" stopColor="#a9dfff" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#57bfff" stopOpacity="0" />
            </RadialGradient>

            <LinearGradient id="smokeStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <Stop offset="50%" stopColor="#dff8ff" stopOpacity="0.88" />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </LinearGradient>

            <LinearGradient id="verticalSmokeStroke" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <Stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          <Rect width={screenWidth} height={screenHeight} fill="url(#bgGlow)" />

          {Array.from({ length: 48 }).map((_, i) => {
            const angle = (360 / 48) * i;
            const p1 = polarToCartesian(centerX, centerY, 72, angle);
            const p2 = polarToCartesian(centerX, centerY, 320, angle);

            const rayProps = useAnimatedProps(() => ({
              opacity: 0.03 + aura.value * 0.05 + energyBurst.value * 0.05,
            }));

            return (
              <AnimatedLine
                key={`ray-${i}`}
                animatedProps={rayProps}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#ffd8ef"
                strokeWidth={1}
              />
            );
          })}

          <AnimatedCircle
            animatedProps={bgAuraProps}
            cx={centerX}
            cy={centerY}
            fill="url(#auraGradient)"
          />

          <AnimatedCircle
            animatedProps={haloProps}
            cx={centerX}
            cy={centerY}
            fill="none"
            stroke="#ffcd93"
            strokeWidth={1.2}
          />

          <AnimatedG animatedProps={rotatingOuterProps}>
            <Circle
              cx={centerX}
              cy={centerY}
              r={58}
              fill="none"
              stroke="#ffcd93"
              strokeOpacity={0.18}
              strokeWidth={1}
            />
            <Circle
              cx={centerX}
              cy={centerY}
              r={49}
              fill="none"
              stroke="#ffcd93"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          </AnimatedG>

          <AnimatedG animatedProps={rotatingInnerProps}>
            <Circle
              cx={centerX}
              cy={centerY}
              r={65}
              fill="none"
              stroke="#ffcd93"
              strokeOpacity={0.08}
              strokeWidth={1}
            />
          </AnimatedG>

          <AnimatedCircle
            animatedProps={coreProps}
            cx={centerX}
            cy={centerY}
            fill="url(#coreGradient)"
          />

          <AnimatedCircle
            animatedProps={glyphProps}
            cx={centerX}
            cy={centerY}
            r={36}
            fill="none"
            stroke="#fcdfab"
            strokeWidth={6}
            opacity={0.08}
          />

          <AnimatedCircle
            animatedProps={glyphProps}
            cx={centerX}
            cy={centerY}
            r={34}
            fill="none"
            stroke="#ffed9f"
            strokeWidth={1.6}
          />

          <AnimatedLine
            animatedProps={glyphProps}
            x1={centerX}
            y1={centerY - 34}
            x2={centerX}
            y2={centerY + 34}
            stroke="#ffeece"
            strokeWidth={1.4}
          />

          <AnimatedLine
            animatedProps={glyphProps}
            x1={centerX - 34}
            y1={centerY}
            x2={centerX + 34}
            y2={centerY}
            stroke="#ffeece"
            strokeWidth={1.4}
          />

          <AnimatedPath
            animatedProps={glyphProps}
            d={`
              M ${centerX} ${centerY - 34}
              Q ${centerX + 22} ${centerY}
                ${centerX} ${centerY + 34}
              Q ${centerX - 22} ${centerY}
                ${centerX} ${centerY - 34}
            `}
            fill="none"
            stroke="#ffeece"
            strokeWidth={1.2}
          />

          <AnimatedPath
            animatedProps={glyphProps}
            d={`
              M ${centerX - 34} ${centerY}
              Q ${centerX} ${centerY - 22}
                ${centerX + 34} ${centerY}
              Q ${centerX} ${centerY + 22}
                ${centerX - 34} ${centerY}
            `}
            fill="none"
            stroke="#ffeece"
            strokeWidth={1.2}
          />

          <AnimatedSvgText
            animatedProps={messageProps}
            x={centerX}
            y={centerY + 150}
            fontSize="30"
            fontWeight="600"
            fill="rgb(255, 216, 143)"
            textAnchor="middle"
          >
            Hello World
          </AnimatedSvgText>

          <AnimatedSvgText
            animatedProps={subtitleProps}
            x={centerX}
            y={centerY + 182}
            fontSize="11"
            letterSpacing="3"
            fill="#dff4ff"
            textAnchor="middle"
          >
            THE ORACLE REVEALS
          </AnimatedSvgText>
        </Svg>

        {!revealed && (
          <View style={styles.hintWrap} pointerEvents="none">
            <Text style={styles.hint}>toque para invocar</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  videoFrame: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  hintWrap: {
    position: 'absolute',
    bottom: 84,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  hint: {
    color: '#eef8ff',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'lowercase',
  },
});