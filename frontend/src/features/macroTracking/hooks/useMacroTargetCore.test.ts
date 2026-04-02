import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MacroTargetState } from "@/types/macro";

import {
	balanceMacroPercentages,
	calculateMacroAdjustment,
	useMacroTargetCore,
} from "./useMacroTargetCore";

const baseTarget: MacroTargetState = {
	proteinPercentage: 30,
	carbsPercentage: 40,
	fatsPercentage: 30,
	lockedMacros: [],
};

describe("balanceMacroPercentages", () => {
	it("returns the input target when percentages already sum to 100", () => {
		expect(balanceMacroPercentages(baseTarget)).toBe(baseTarget);
	});

	it("reduces the largest unlocked macro when total exceeds 100", () => {
		const adjusted = balanceMacroPercentages({
			proteinPercentage: 40,
			carbsPercentage: 40,
			fatsPercentage: 30,
			lockedMacros: [],
		});

		expect(adjusted).toEqual({
			proteinPercentage: 30,
			carbsPercentage: 40,
			fatsPercentage: 30,
			lockedMacros: [],
		});
	});

	it("balances using protein when all macros are locked", () => {
		const adjusted = balanceMacroPercentages({
			proteinPercentage: 35,
			carbsPercentage: 40,
			fatsPercentage: 40,
			lockedMacros: ["protein", "carbs", "fats"],
		});

		expect(adjusted).toEqual({
			proteinPercentage: 20,
			carbsPercentage: 40,
			fatsPercentage: 40,
			lockedMacros: ["protein", "carbs", "fats"],
		});
	});
});

describe("calculateMacroAdjustment", () => {
	it("clamps values to macro bounds and keeps total at 100", () => {
		const adjusted = calculateMacroAdjustment(baseTarget, "protein", 120);

		expect(adjusted.proteinPercentage).toBe(70);
		expect(
			adjusted.proteinPercentage +
				adjusted.carbsPercentage +
				adjusted.fatsPercentage,
		).toBe(100);
	});

	it("adjusts the single unlocked macro when two are fixed", () => {
		const adjusted = calculateMacroAdjustment(
			{
				proteinPercentage: 30,
				carbsPercentage: 40,
				fatsPercentage: 30,
				lockedMacros: ["fats"],
			},
			"protein",
			60,
		);

		expect(adjusted).toEqual({
			proteinPercentage: 60,
			carbsPercentage: 10,
			fatsPercentage: 30,
			lockedMacros: ["fats"],
		});
	});
});

describe("useMacroTargetCore", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("updates target and emits persistent changes on slider updates", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() => useMacroTargetCore(baseTarget, onChange));

		act(() => {
			result.current.handleChange("protein", 50);
		});

		expect(result.current.isAdjusting).toBe("protein");
		expect(result.current.target.proteinPercentage).toBe(50);
		expect(
			result.current.target.proteinPercentage +
				result.current.target.carbsPercentage +
				result.current.target.fatsPercentage,
		).toBe(100);

		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith(result.current.target, true);

		act(() => {
			vi.advanceTimersByTime(100);
		});

		expect(result.current.isAdjusting).toBeUndefined();
	});

	it("toggles locks and enforces the two-lock maximum", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() => useMacroTargetCore(baseTarget, onChange));

		act(() => {
			result.current.toggleLock("protein");
		});
		expect(result.current.target.lockedMacros).toEqual(["protein"]);

		act(() => {
			result.current.toggleLock("carbs");
		});
		expect(result.current.target.lockedMacros).toEqual(["protein", "carbs"]);

		const callbacksAfterTwoLocks = onChange.mock.calls.length;

		act(() => {
			result.current.toggleLock("fats");
		});

		expect(result.current.target.lockedMacros).toEqual(["protein", "carbs"]);
		expect(onChange).toHaveBeenCalledTimes(callbacksAfterTwoLocks);

		act(() => {
			result.current.toggleLock("protein");
		});

		expect(result.current.target.lockedMacros).toEqual(["carbs"]);
		expect(onChange).toHaveBeenLastCalledWith(
			expect.objectContaining({ lockedMacros: ["carbs"] }),
			false,
		);
	});
});
