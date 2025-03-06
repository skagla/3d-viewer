"use client";

import {
  Accordion,
  Button,
  Checkbox,
  Label,
  TextInput,
  ToggleSwitch,
} from "flowbite-react";
import { useContext, useState } from "react";

import {
  MapSceneContext,
  MapSceneContextType,
} from "../providers/map-scene-provider";
import { Mesh, MeshStandardMaterial } from "three";

export function Form() {
  const [enabled, setEnabled] = useState<boolean>(true);
  const { mapScene } = useContext(MapSceneContext) as MapSceneContextType;

  function handleChange() {
    if (!mapScene) return;

    mapScene.toggleClippingBox();
    setEnabled(!enabled);
  }

  function handleCheckboxChange(name: string) {
    if (!mapScene) return;

    const mesh = mapScene.model.getObjectByName(name);
    if (mesh) {
      mesh.visible = !mesh.visible;
    }
  }

  return (
    <div className="w-full flex flex-col gap-2 overflow-y-auto">
      <div className="w-full flex flex-col gap-3 p-4 border border-gray-200 rounded shadow">
        <ToggleSwitch
          checked={enabled}
          label="Toggle Slicing Box"
          onChange={handleChange}
        />
        <Accordion>
          <Accordion.Panel>
            <Accordion.Title>Layers</Accordion.Title>
            <Accordion.Content>
              <div className="mt-2">
                {mapScene?.model.children.map((child) => {
                  const key = `toggle-visibility-${child.name}`;
                  const color = `#${(
                    (child as Mesh).material as MeshStandardMaterial
                  ).color.getHexString()}`;
                  return (
                    <div key={key} className="flex items-center ml-2">
                      <span
                        className="inline-block w-4 h-4"
                        style={{
                          backgroundColor: color,
                        }}
                      ></span>
                      <Checkbox
                        id={key}
                        defaultChecked
                        onChange={() => handleCheckboxChange(child.name)}
                        className="ml-2"
                      />
                      <Label htmlFor={key} className="ml-2">
                        {child.name}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </Accordion.Content>
          </Accordion.Panel>
        </Accordion>
      </div>
    </div>
  );
}
