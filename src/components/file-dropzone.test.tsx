import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { FileDropzone } from "./file-dropzone";
import { useWindowFileDrag } from "../lib/use-window-file-drag";

const file = new File(["x"], "plan.pdf", { type: "application/pdf" });
const dt = (files: File[] = [], types = ["Files"]) => ({ files, types, dropEffect: "none" });

// Oracle: the File objects handed to the drop event, and the DataTransfer
// type list a browser reports for an OS file drag ("Files").
describe("FileDropzone", () => {
  it("highlights while files hover and hands the dropped files to onFiles", () => {
    const onFiles = vi.fn();
    render(<FileDropzone onFiles={onFiles} title="Dateien hier ablegen" hint="PDF, DOCX" />);
    const zone = screen.getByText("Dateien hier ablegen").closest("[data-slot=file-dropzone]") as HTMLElement;
    fireEvent.dragEnter(zone, { dataTransfer: dt() });
    expect(zone).toHaveAttribute("data-over");
    fireEvent.drop(zone, { dataTransfer: dt([file]) });
    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(zone).not.toHaveAttribute("data-over");
  });

  it("ignores a drop without files", () => {
    const onFiles = vi.fn();
    render(<FileDropzone onFiles={onFiles} title="Ablegen" />);
    fireEvent.drop(screen.getByText("Ablegen"), { dataTransfer: dt([]) });
    expect(onFiles).not.toHaveBeenCalled();
  });
});

describe("FileDropzone onBrowse", () => {
  it("is a button that opens the picker by click, Enter and Space", () => {
    const onBrowse = vi.fn();
    render(<FileDropzone onFiles={() => {}} onBrowse={onBrowse} title="Dateien hier ablegen" aria-label="Dateien hochladen" />);
    const zone = screen.getByRole("button", { name: "Dateien hochladen" });
    fireEvent.click(zone);
    fireEvent.keyDown(zone, { key: "Enter" });
    fireEvent.keyDown(zone, { key: " " });
    expect(onBrowse).toHaveBeenCalledTimes(3);
  });
});

describe("useWindowFileDrag", () => {
  const fire = (type: string, types = ["Files"]) => {
    const e = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(e, "dataTransfer", { value: { types } });
    act(() => { window.dispatchEvent(e); });
    return e;
  };

  it("is true between the first file dragenter and the matching dragleave or drop", () => {
    const { result } = renderHook(() => useWindowFileDrag());
    fire("dragenter");
    fire("dragenter");
    expect(result.current).toBe(true);
    fire("dragleave");
    expect(result.current).toBe(true);
    fire("dragleave");
    expect(result.current).toBe(false);
    fire("dragenter");
    const drop = fire("drop");
    expect(result.current).toBe(false);
    expect(drop.defaultPrevented).toBe(true);
  });

  it("ignores drags that carry no files", () => {
    const { result } = renderHook(() => useWindowFileDrag());
    fire("dragenter", ["text/plain"]);
    expect(result.current).toBe(false);
  });
});
