"use client";

import { SceneView } from "../three/SceneView";

export function TexturePicker(props: {
	sceneView: SceneView;
	childName: string;
}) {
	let showTexture = false;
	const sceneView = props.sceneView;
	const childName = props.childName;

	// console.log(sceneView);
	// console.log(sceneView);

	return (
		<>
			<span
				onClick={openTexturePicker}
				className="inline-block w-5 h-5 flex-none rounded"
				style={{
					backgroundColor: "white",
				}}></span>
		</>
	);

	function openTexturePicker() {
		if (!sceneView) return;

		showTexture = !showTexture;
		sceneView.textureMesh(showTexture, childName);
	}
}
