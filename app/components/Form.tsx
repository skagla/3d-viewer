"use client";

import { ChangeEvent, ReactNode, useContext, useRef, useState } from "react";

import {
  SceneViewContext,
  SceneViewContextType,
} from "../providers/scene-view-provider";
import { Mesh, MeshStandardMaterial } from "three";
import { CustomEvent } from "../three/SceneView";

function Toggle({
  title,
  onChange,
  defaultChecked,
}: {
  title: string;
  onChange: (e: any) => void;
  defaultChecked?: boolean;
}) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        value=""
        className="sr-only peer"
        onChange={onChange}
        defaultChecked={defaultChecked ? true : false}
      />
      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
      <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
        {title}
      </span>
    </label>
  );
}

function Accordion({
  children,
  title,
}: {
  children?: ReactNode;
  title: string;
}) {
  const [expanded, setExpanded] = useState<boolean>(true);
  const accordionBodyRef = useRef<HTMLDivElement>(null);

  function handleClick() {
    if (!accordionBodyRef.current) return;

    accordionBodyRef.current.classList.toggle("hidden");
    setExpanded(!expanded);
  }

  return (
    <div>
      <h2 id="accordion-collapse-heading-1">
        <button
          type="button"
          className="flex items-center justify-between w-full p-5 font-medium rtl:text-right text-gray-500 border border-b-0 border-gray-200 rounded-t focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3 hover:cursor-pointer"
          data-accordion-target="#accordion-collapse-body-1"
          aria-expanded={expanded ? "true" : "false"}
          aria-controls="accordion-collapse-body-1"
          onClick={handleClick}
        >
          <span>{title}</span>
          <svg
            data-accordion-icon
            className="w-3 h-3 rotate-180 shrink-0"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 10 6"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5 5 1 1 5"
            />
          </svg>
        </button>
      </h2>
      <div
        id="accordion-collapse-body-1"
        ref={accordionBodyRef}
        aria-labelledby="accordion-collapse-heading-1"
      >
        <div className="p-5 border border-gray-200 dark:border-gray-700 dark:bg-gray-900">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Form() {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const { sceneView } = useContext(SceneViewContext) as SceneViewContextType;

  function handleChange() {
    if (!sceneView) return;

    sceneView.toggleClippingBox();
  }

  function handleChangeCG() {
    if (!sceneView) return;

    sceneView.toggleCoordinateGrid();
  }

  function handleChangeWireframe() {
    if (!sceneView) return;

    sceneView.toggleWireFrame();
  }

  function handleCheckboxChange(name: string) {
    if (!sceneView) return;

    sceneView.toggleLayerVisibility(name);
  }

  function handleChangeTopography() {
    if (!sceneView) return;

    sceneView.toggleTopography();
  }

  function handleDrilling(e: ChangeEvent) {
    if (!sceneView) return;

    if ((e.target as HTMLInputElement).checked) {
      sceneView.enableRaycaster();
      sceneView.addEventListener("svg-created", handleSVGCreated);
    } else {
      sceneView.disableRaycaster();
      sceneView.removeEventListener("svg-created", handleSVGCreated);
    }
  }

  function handleSVGCreated(e: CustomEvent) {
    if (!svgContainerRef.current || !e.detail || !e.detail.element) return;

    while (svgContainerRef.current.children.length > 0) {
      const c = svgContainerRef.current.children[0];
      svgContainerRef.current.removeChild(c);
    }
    svgContainerRef.current.appendChild(e.detail.element);
  }

  return (
    <div className="w-full flex flex-col gap-2 overflow-y-auto">
      <div className="w-full flex flex-col gap-3 p-4 border border-gray-200 rounded shadow">
        <Toggle title="Slicing Box" onChange={handleChange} />
        <Toggle title="Drilling Profiler" onChange={handleDrilling} />
        <Toggle title="Coordinate Grid" onChange={handleChangeCG} />
        <Toggle title="Wireframe" onChange={handleChangeWireframe} />
        <Toggle
          title="Topography (OSM)"
          onChange={handleChangeTopography}
          defaultChecked
        />
        <Accordion title="Layers">
          {
            <div className="flex flex-col gap-2">
              {sceneView?.model.children.map((child) => {
                const key = `toggle-visibility-${child.name}`;
                const color = `#${(
                  (child as Mesh).material as MeshStandardMaterial
                ).color.getHexString()}`;
                const visible = (child as Mesh).visible;

                return (
                  <div
                    key={key}
                    className="flex items-center justify-start gap-2.5 border-b border-gray-200 py-1"
                  >
                    <span
                      className="inline-block w-5 h-5 flex-none rounded"
                      style={{
                        backgroundColor: color,
                      }}
                    ></span>
                    <input
                      id={key}
                      type="checkbox"
                      onChange={() => handleCheckboxChange(child.name)}
                      className="hover:cursor-pointer"
                      defaultChecked={visible ? true : false}
                    />
                    <label
                      htmlFor={key}
                      className="antialiased font-light text-gray-700"
                    >
                      {child.name}
                    </label>
                  </div>
                );
              })}
            </div>
          }
        </Accordion>
        <div ref={svgContainerRef}> </div>
      </div>
    </div>
  );
}
