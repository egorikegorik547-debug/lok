import { useEffect } from "react";
import { MARKUP } from "@/game/markup";
import { startGame } from "@/game/game";
import { iconizeDom } from "@/game/icons";

let started = false;

export default function App() {
  useEffect(() => {
    // Игра стартует один раз — после того, как разметка уже в DOM.
    if (started) return;
    started = true;
    startGame();
    // эмодзи в интерфейсе → векторные иконки (звук не затрагивается)
    iconizeDom(document.body);
  }, []);

  return <div id="gameRoot" dangerouslySetInnerHTML={{ __html: MARKUP }} />;
}
