"use client";

import { useState } from "react";
import type { getPresentation } from "@/app/actions";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { PrintView2 } from "./PrintView2";

export type Presentation = NonNullable<Awaited<ReturnType<typeof getPresentation>>> & {
  slides: { id?: number; content: string; order: number; presentationId: number }[];
};

export function PrintPreview({ presentation }: { presentation: Presentation }) {
  const [config, setConfig] = useState({
    progress: true,
    controls: true,
    center: true,
    pdfSeparateFragments: true,
    pdfMaxPagesPerSlide: 1,
    pdfPageHeightOffset: -1,
  });

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Print Preview</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center space-x-2">
          <Switch
            checked={config.progress}
            onCheckedChange={(v) => setConfig({ ...config, progress: v })}
          />
          <span>Progress</span>
        </label>
        <label className="flex items-center space-x-2">
          <Switch
            checked={config.controls}
            onCheckedChange={(v) => setConfig({ ...config, controls: v })}
          />
          <span>Controls</span>
        </label>
        <label className="flex items-center space-x-2">
          <Switch
            checked={config.center}
            onCheckedChange={(v) => setConfig({ ...config, center: v })}
          />
          <span>Center</span>
        </label>
        <label className="flex items-center space-x-2">
          <Switch
            checked={config.pdfSeparateFragments}
            onCheckedChange={(v) =>
              setConfig({ ...config, pdfSeparateFragments: v })
            }
          />
          <span>Separate Fragments</span>
        </label>
        <label className="flex items-center space-x-2">
          <span>Max Pages Per Slide</span>
          <Input
            type="number"
            value={config.pdfMaxPagesPerSlide}
            onChange={(e) =>
              setConfig({ ...config, pdfMaxPagesPerSlide: Number(e.target.value) })
            }
            className="w-20"
          />
        </label>
        <label className="flex items-center space-x-2">
          <span>Page Height Offset</span>
          <Input
            type="number"
            value={config.pdfPageHeightOffset}
            onChange={(e) =>
              setConfig({ ...config, pdfPageHeightOffset: Number(e.target.value) })
            }
            className="w-20"
          />
        </label>
      </div>
      <div className="border rounded-md p-2">
        <PrintView2 presentation={presentation} config={config} />
      </div>
    </div>
  );
}
