// import { useState } from "react";
import { TextureType } from "../three/utils/TextureType";
// import { SceneView } from "../three/SceneView";
import Image from "next/image";

export function TextureToPick(props: {
	sendDataToParent: (textureType: TextureType, textureSrc: string) => void;
	textureType: TextureType;
}) {
	const sendDataToParent = props.sendDataToParent;
	const textureType = props.textureType;
	let textureSrc = "";

	switch (textureType) {
		case TextureType.NO_TEXTURE:
			textureSrc = "/3d-viewer/textures/empty.jpg";
			break;
		case TextureType.SAND:
			textureSrc = "/3d-viewer/textures/sand.jpg";
			break;
		case TextureType.SCHOTTER:
			textureSrc = "/3d-viewer/textures/schotter.jpg";
			break;
		case TextureType.KALK:
			textureSrc = "/3d-viewer/textures/kalk_5pt_bg-w.jpg";
			break;
		case TextureType.KRISTALLIN:
			textureSrc = "/3d-viewer/textures/kristallin.jpg";
			break;
	}
	// border-blue-500
	return (
		<>
			<div
				className=" size-7 border rounded border-gray-200 dark:border-gray-400"
				onClick={() => enableTexture(textureType)}>
				<Image
					src={textureSrc}
					width={24}
					height={24}
					alt="symbol for an empty texture"
					className="border rounded"
				/>
			</div>
		</>
	);

	function enableTexture(textureType: TextureType) {
		sendDataToParent(textureType, textureSrc);
	}
}

/*

        <div
                                className=" size-7 border-3 rounded border-blue-500"
                                onClick={() => enableTexture(TextureType.NO_TEXTURE)}>
                                <Image
                                    src="/3d-viewer/textures/empty.jpg"
                                    width={24}
                                    height={24}
                                    alt="symbol for an empty texture"
                                    className="border rounded"
                                />
                            </div>

                            */

// function enableTexture(textureType: TextureType) {
// 	if (!sceneView) return;
// 	// setShowTexture(!showTexture);
// 	switch (textureType) {
// 		case TextureType.NO_TEXTURE:
// 			setSrcTextureType("/3d-viewer/textures/empty.jpg");
// 			break;
// 		case TextureType.SAND:
// 			setSrcTextureType("/3d-viewer/textures/sand.jpg");
// 			break;
// 		case TextureType.SCHOTTER:
// 			setSrcTextureType("/3d-viewer/textures/schotter.jpg");
// 			break;
// 		case TextureType.KALK:
// 			setSrcTextureType("/3d-viewer/textures/kalk_5pt_bg-w.jpg");
// 			break;
// 		case TextureType.KRISTALLIN:
// 			setSrcTextureType("/3d-viewer/textures/kristallin.jpg");
// 			break;
// 	}
// 	sceneView.textureMesh(true, childName, textureType);
// }
