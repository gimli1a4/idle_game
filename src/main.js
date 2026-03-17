import "./style.css";
import { initUI, runBootSequence, render } from "./ui.js";
import { startLoop } from "./gameLoop.js";

async function main() {
  initUI();
  await runBootSequence();
  startLoop(render);
}

main();
