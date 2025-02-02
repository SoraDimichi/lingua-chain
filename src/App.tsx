import { useEffect, useState } from "react";
import { PROPOSALS } from "./data";
import ProporsalForm from "./ProposalForm";
import VotingForm from "./VotingForm";

interface Proposal {
  id: number;
  title: string;
  description: string;
}

export enum Vote {
  For = "for",
  Against = "against",
  Abstain = "abstain",
}

export default function ProposalsList() {
  const [proposals, setProposals] = useState<Proposal[]>(PROPOSALS);

  const addProposal = (proposal: Proposal) =>
    setProposals((prev) => [proposal, ...prev]);

  return (
    <div className="min-h-dvh grid grid-rows-[min-content_1fr] h-full">
      <header className="sticky shadow-2xl top-0 z-10 flex justify-between items-center p-4 border-b border-gray-500 bg-gray-900">
        <div className="flex gap-4">lingua-chain</div>
      </header>
      <div className="bg-linear-to-t from-cyan-900 to-gray-900 fixed top-0 z-1 h-full w-full" />
      <main className="container grid grid-rows-[min-content_1fr] mx-auto z-2 h-full">
        <div className="-ml-1 mb-4 text-4xl font-black h-13 font-semibold text-white mt-10 flex justify-between">
          <h1>Proposals</h1>
          <AddButton addProposal={addProposal} />
        </div>
        <div className="border-x shadow-3xl border-t border-gray-500 w-full bg-gray-900 rounded-xs">
          <div className="divide-gray-700 divide-y-1 px-6">
            {proposals.map((proposal) => (
              <Proposal {...proposal} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export type FormButtonP = { addProposal: AddProposal };
export type AddProposal = (proposal: Proposal) => void;

export const AddButton = ({ addProposal }: FormButtonP) => {
  const [shown, setShowForm] = useState(false);

  const close = () => setShowForm(false);

  return (
    <>
      <button
        className={`mt-1 px-6 grid place-items-center border-2 border-gray-400 rounded-xs`}
        onClick={() => setShowForm(true)}
      >
        <span className="text-base">Compose a proposal</span>
      </button>
      {shown && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-20 flex items-center justify-center z-50">
          <div className="relative min-w-75">
            <ProporsalForm addProposal={addProposal} close={close} />
            <button
              className="text-gray-600 absolute absolute -top-2 -right-10 text-base"
              onClick={close}
            >
              [ <span className="text-red-700">x</span> ]
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const buttonStyle = (visible: boolean) =>
  `w-9 h-9 grid place-items-center rounded-full border-2 ${visible ? "" : "pointer-events-none in"}visible`;
const VotingButtons = () => {
  const [vote, setVote] = useState<Vote | undefined>(undefined);

  return (
    <div className="flex gap-3 items-center">
      <button
        className={`${buttonStyle(vote !== Vote.For)} border-green-800 text-green-800`}
        onClick={() => setVote(Vote.For)}
      >
        <For />
      </button>
      <button
        className={`${buttonStyle(vote !== Vote.Against)} border-red-800 text-red-800`}
        onClick={() => setVote(Vote.Against)}
      >
        <Against />
      </button>
      <button
        className={`${buttonStyle(vote !== Vote.Abstain)} border-gray-500 text-gray-500`}
        onClick={() => setVote(Vote.Abstain)}
      >
        <span className="text-3xl -mt-2">-</span>
      </button>
      {vote && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-20 flex items-center justify-center z-50">
          <div className="relative min-w-75">
            <VotingForm vote={vote} close={close} />
            <button
              className="text-gray-600 absolute absolute -top-2 -right-10 text-base"
              onClick={() => setVote(undefined)}
            >
              [ <span className="text-red-700">x</span> ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Proposal = ({ id, title, description }: Proposal) => {
  const [expanded, setExpanded] = useState(false);
  const [vote, setVote] = useState<Vote | undefined>(undefined);
  // const [range, setRange] = useState(0);

  // useEffect(() => {
  //   if (range !== 0 || !vote) return;
  //
  //   setVote(undefined);
  // }, [range, vote]);

  return (
    <div key={id} className="py-3.5 text-white">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <VotingButtons />
      </div>
      <div className="mt-4 inline-grid grid-cols-[1fr_max_content] grid-flow-col justify-between w-full">
        <p className={`text-gray-300  ${expanded ? "" : "truncate"}`}>
          {description}
        </p>
        {!expanded && (
          <button className="ml-4" onClick={() => setExpanded(true)}>
            (read more)
          </button>
        )}
      </div>
    </div>
  );
};

const For = () => (
  <svg
    viewBox="0 0 24 24"
    width="20px"
    height="20px"
    className="stroke-current"
  >
    <path
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="m5 13l4 4L19 7"
    ></path>
  </svg>
);

const Against = () => (
  <svg viewBox="0 0 24 24" width="20px" height="20px">
    <path
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M6 18L18 6M6 6l12 12"
    ></path>
  </svg>
);
