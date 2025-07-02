export const formStyles = {
  label: "block text-sm font-medium text-gray-300",
  container: "space-y-2",
  input: {
    base: `w-full px-4 py-2 bg-gray-700/70 border-2 rounded-lg text-gray-100 
           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
           transition-all duration-200 shadow-sm`,
    error: "border-red-500/70",
    normal: "border-gray-600/70",
    withIcon: "pl-10",
    withUnit: "pr-10",
    withPassword: "pr-10",
    numberInput: `[&::-webkit-inner-spin-button]:appearance-none
                  [&::-webkit-outer-spin-button]:appearance-none
                  [-moz-appearance:textfield]`,
    disabled:
      "bg-gray-600/40 border-gray-500/50 text-gray-400 cursor-not-allowed opacity-70",
  },
  error: "text-xs text-red-400",
  helper: "text-xs text-gray-500",
  maxLength: "text-xs text-gray-500",
  iconContainer: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500",
  unitContainer: "absolute right-4 top-1/2 -translate-y-1/2 text-gray-400",
  select: {
    container: "relative",
    base: `appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]
                bg-[length:2rem] bg-[right_0.75rem_center] bg-no-repeat`,
  },
  button: {
    base: "py-3 rounded-lg font-medium flex items-center justify-center",
    primary: `text-white bg-gradient-to-r from-indigo-600 to-blue-500 
              hover:from-indigo-500 hover:to-blue-400 shadow-lg shadow-indigo-500/30`,
    secondary: "border border-gray-600/50 text-gray-300 hover:bg-gray-700/50",
    common:
      "disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]",
  },
  tab: {
    base: "py-3 px-6 font-medium text-sm focus:outline-none",
    active: "text-indigo-400 border-b-2 border-indigo-500",
    inactive: "text-gray-400 hover:text-gray-300",
  },
  card: {
    container:
      "bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden",
  },
};
