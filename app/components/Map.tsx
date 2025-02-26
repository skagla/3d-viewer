"use client";

import { useEffect, useRef } from "react";
import { init } from "../three/utils/init";

export function Map() {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;
    if (!divRef.current) return;

    if (!ignore) {
      init(divRef.current);
    }

    return () => {
      ignore = true;
    };
  }, [divRef]);

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <div className="w-full h-full" ref={divRef}></div>
    </div>
  );
}
