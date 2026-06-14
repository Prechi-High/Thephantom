import { spawn } from "child_process";
import open from "open";

console.log("--------------------------------------------------");
console.log("🚀 Starting THE PHANTOM V5 MVP1 Frontend...");
console.log("--------------------------------------------------");

const devServer = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
});

// Wait for Vite to boot (usually 3 seconds), then open browser
setTimeout(() => {
  console.log("\n🌐 Launching Dashboard at http://localhost:5173 ...");
  open("http://localhost:5173");
}, 4000);
