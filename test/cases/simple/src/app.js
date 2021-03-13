import { h } from "forgo";
import lazy, { Suspense } from "forgo-lazy";

const Split = lazy(() => import("./split"));

const App = (_, args) => {
  const fallback = () => {
    const html = args.environment.document.getElementById("__forgo").innerHTML;
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return {
    render() {
      return (
        <div>
          <Suspense fallback={fallback}>
            <Split />
          </Suspense>
        </div>
      );
    },
  };
};

export default App;
