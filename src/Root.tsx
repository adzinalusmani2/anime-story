import React from "react";
import {Composition} from "remotion";
import {DemoJokowi, DEMO_JOKOWI_FRAMES} from "./scenes/DemoJokowi";
import {DemoFullBody, DEMO_FULLBODY_FRAMES} from "./scenes/DemoFullBody";
import {FPS, H, W} from "./styles/palette";

// Satu komposisi per video. Render dengan: npx remotion render src/index.ts <Id> out/<nama>.mp4
export const Root: React.FC = () => (
  <>
    <Composition id="DemoJokowi" component={DemoJokowi} durationInFrames={DEMO_JOKOWI_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="DemoFullBody" component={DemoFullBody} durationInFrames={DEMO_FULLBODY_FRAMES} fps={FPS} width={W} height={H} />
  </>
);
