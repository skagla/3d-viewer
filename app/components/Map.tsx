"use client";

import { useEffect, useRef } from "react";
import { init } from "../three/utils/init";
import { initSimple } from "../three/simple-example";

export function Map() {
  const divRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!divRef.current) return;
    init(divRef.current);
    //initSimple(divRef.current);
  }, [divRef]);

  return <div className="w-full h-full" ref={divRef}></div>;
}
