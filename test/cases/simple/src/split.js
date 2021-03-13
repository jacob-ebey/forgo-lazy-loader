import { h } from "forgo";

import styles from "./split.module.css";

const handleClick = () => {
  console.log("Clicked!!!");
};

function Split() {
  return {
    render() {
      return (
        <main>
          <h1 className={styles.split}>I'm Split! :D and have styles</h1>
          <button onclick={handleClick}>Log to the console</button>
        </main>
      );
    },
  };
}

export default Split;
