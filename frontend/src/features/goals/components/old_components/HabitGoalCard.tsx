// import ProgressBar from "./ProgressBar";

// interface HabitGoalCardProps {
//   title: string;
//   icon: JSX.Element;
//   current: number;
//   target: number;
//   progress: number;
//   accentColor?: "indigo" | "blue" | "green";
//   isComplete?: boolean;
// }

// function HabitGoalCard({
//   title,
//   icon,
//   current,
//   target,
//   progress,
//   accentColor = "indigo",
//   isComplete = false,
// }: HabitGoalCardProps) {
//   const colorClasses = {
//     indigo: "from-indigo-900/20 to-transparent hover:bg-indigo-800/20",
//     blue: "from-blue-900/20 to-transparent hover:bg-blue-800/20",
//     green: "from-green-900/20 to-transparent hover:bg-green-800/20",
//   };

//   return (
//     <div
//       className={`bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
//     >
//       <div
//         className={`bg-gradient-to-r ${colorClasses[accentColor]} p-5 h-full`}
//       >
//         <div className="flex justify-between items-start mb-5">
//           <h3 className="font-medium text-gray-200">{title}</h3>
//           <div className={`bg-${accentColor}-600/20 p-1.5 rounded-lg`}>
//             <svg
//               className={`w-4 h-4 text-${accentColor}-400`}
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               {icon}
//             </svg>
//           </div>
//         </div>

//         <div className="flex items-end gap-1 mb-3">
//           <span className="text-2xl font-bold text-gray-200">{current}</span>
//           <span className="text-gray-400 text-sm">/ {target}</span>
//           {isComplete ? (
//             <span className="ml-auto text-sm text-green-400 flex items-center gap-1">
//               <svg
//                 className="w-3 h-3"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M5 13l4 4L19 7"
//                 />
//               </svg>
//               Complete
//             </span>
//           ) : (
//             <span className="ml-auto text-sm text-gray-400">{progress}%</span>
//           )}
//         </div>

//         <ProgressBar
//           progress={progress}
//           color={isComplete ? "green" : accentColor}
//           height="sm"
//         />
//       </div>
//     </div>
//   );
// }

// export default HabitGoalCard;
