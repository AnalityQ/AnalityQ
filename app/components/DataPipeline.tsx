import { pipelineSteps } from "@/lib/analityq-data";

export function DataPipeline() {
  return (
    <div className="pipeline">
      <div className="pipeline-line" aria-hidden="true" />
      {pipelineSteps.map((step, index) => (
        <article key={step.title} className="pipeline-step">
          <span className="pipeline-index">{index + 1}</span>
          <h3 className="mt-5 text-xl font-black text-white">{step.title}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">{step.text}</p>
        </article>
      ))}
    </div>
  );
}
