"use client";

import { useState } from "react";
import { ColorResult, TwitterPicker } from "react-color";
import { SceneView } from "../three/SceneView";
import { Color } from "three";

export function ColorPicker(props: {
  color: string;
  sceneView: SceneView;
  childName: string;
}) {
  const [meshColor, setMeshColor] = useState(props.color);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const childName = props.childName;
  const sceneView = props.sceneView;

  // console.log(meshColor);
  if (showColorPicker) {
    return (
      <>
        <TwitterPicker color={meshColor} onChange={setNewColor} />

        <span
          className="inline-block w-5 h-5 flex-none rounded"
          onClick={toggleColorPicker}
          style={{
            backgroundColor: meshColor,
          }}
        ></span>
      </>
    );
  } else {
    return (
      <>
        <span
          className="inline-block w-5 h-5 flex-none rounded "
          onClick={toggleColorPicker}
          style={{
            backgroundColor: meshColor,
          }}
        ></span>
      </>
    );
  }

  function toggleColorPicker() {
    setShowColorPicker(!showColorPicker);
  }

  function setNewColor(newColor: ColorResult) {
    if (!sceneView) return;

    setMeshColor(newColor.hex);
    setShowColorPicker(false);
    // console.log(childName);
    // console.log(newColor.hex);
    // console.log(sceneView);
    sceneView.colorMesh(childName, new Color(newColor.hex));
  }
}
