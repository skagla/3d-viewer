"use client";

import { useState } from "react";
import { SceneView } from "../three/SceneView";
import { TextureType } from "../three/utils/TextureType";
import Image from "next/image";
import { TextureToPick } from "./TextureToPick";
export function TexturePicker(props: {
	sceneView: SceneView;
	childName: string;
}) {
	// let showTexture = false;
	// const [showTexture, setShowTexture] = useState<boolean>(false);
	const [srcTextureType, setSrcTextureType] = useState<string>(
		"/3d-viewer/textures/empty.jpg"
	);

	// let showTexturePopup = false;
	const [showTexturePopup, setShowTexturePopup] = useState<boolean>(false);

	const sceneView = props.sceneView;
	const childName = props.childName;
	//  h-24 w-16
	// className=" w-full h-full size-4 border rounded border-gray-200 dark:border-gray-400 bg-blue-400"

	const texturePickerEmpty = (
		<TextureToPick
			textureType={TextureType.NO_TEXTURE}
			sendDataToParent={handleDataFromChild}></TextureToPick>
	);
	const texturePickerSand = (
		<TextureToPick
			textureType={TextureType.SAND}
			sendDataToParent={handleDataFromChild}></TextureToPick>
	);
	const texturePickerSchotter = (
		<TextureToPick
			textureType={TextureType.SCHOTTER}
			sendDataToParent={handleDataFromChild}></TextureToPick>
	);
	const texturePickerKalk = (
		<TextureToPick
			textureType={TextureType.KALK}
			sendDataToParent={handleDataFromChild}></TextureToPick>
	);
	const texturePickerKristallin = (
		<TextureToPick
			textureType={TextureType.KRISTALLIN}
			sendDataToParent={handleDataFromChild}></TextureToPick>
	);

	const texturesToPick = [
		texturePickerEmpty,
		texturePickerSand,
		texturePickerSchotter,
		texturePickerKalk,
		texturePickerKristallin,
	];

	if (showTexturePopup) {
		return (
			<>
				<span
					onClick={togggleTexturePicker}
					className="relative size-5 flex-none rounded bg-gray-400">
					<div className="absolute size-auto bottom-0 p-1 flex gap-1 border rounded border-gray-200 dark:border-gray-400 bg-white ">
						{texturePickerEmpty}
						{texturePickerSand}
						{texturePickerSchotter}
						{texturePickerKalk}
						{texturePickerKristallin}
					</div>
				</span>
			</>
		);
	} else {
		return (
			<>
				<span
					onClick={togggleTexturePicker}
					className="inline-block w-5 h-5 flex-none rounded">
					<Image
						src={srcTextureType}
						width={24}
						height={24}
						alt="symbol for an empty texture"
						className="border rounded"
					/>
				</span>
			</>
		);
	}

	function togggleTexturePicker() {
		setShowTexturePopup(!showTexturePopup);
		// enableTexture();
	}
	function handleDataFromChild(textureType: TextureType, textureSrc: string) {
		if (!sceneView) return;

		texturesToPick.forEach((element) => {});

		setSrcTextureType(textureSrc);
		sceneView.textureMesh(true, childName, textureType);
	}
}
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

/*

<div
							className=" size-7  border rounded border-gray-200 dark:border-gray-400"
							onClick={() => enableTexture(TextureType.SAND)}>
							<Image
								src="/3d-viewer/textures/sand.jpg"
								width={24}
								height={24}
								alt="symbol for a sand texture"
								className="border rounded"
							/>
						</div>
						<div
							className=" size-7  border rounded border-gray-200 dark:border-gray-400"
							onClick={() => enableTexture(TextureType.SCHOTTER)}>
							<Image
								src="/3d-viewer/textures/schotter.jpg"
								width={24}
								height={24}
								alt="symbol for a schotter texture"
								className="border rounded"
							/>
						</div>
						<div
							className=" size-7  border rounded border-gray-200 dark:border-gray-400"
							onClick={() => enableTexture(TextureType.KALK)}>
							<Image
								src="/3d-viewer/textures/kalk_5pt_bg-w.jpg"
								width={24}
								height={24}
								alt="symbol for a kalk texture"
								className="border rounded"
							/>
						</div>
						<div
							className=" size-7  border rounded border-gray-200 dark:border-gray-400"
							onClick={() => enableTexture(TextureType.KRISTALLIN)}>
							<Image
								src="/3d-viewer/textures/kristallin.jpg"
								width={24}
								height={24}
								alt="symbol for a kristallin texture"
								className="border rounded"
							/>
						</div>


						*/
