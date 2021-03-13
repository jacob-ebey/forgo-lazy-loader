import { h, render } from "forgo";

import App from "./app";

const { nodes } = render(<App />);

const forgoNode = document.getElementById("__forgo");

while (forgoNode?.hasChildNodes()) {
  if (forgoNode.firstChild) {
    forgoNode.removeChild(forgoNode.firstChild);
  }
}

nodes?.forEach((child) => forgoNode?.appendChild(child));
