import { useEffect, useState } from "react";
import ProporsalForm from "./ProposalForm";
import Header from "./Header";
import { useWeb3, daoAddress, provider } from "./context";
import { convertUint256ToDate } from "./utils";
import contractArtifact from "../out/LCTGovernance.sol/LCTGovernance.json";
import VotingForm from "./VotingForm";
import { ethers } from "ethers";

interface Vote {
  voter: string;
  stakeAmount: bigint;
}

interface Proposal {
  id: bigint;
  title: string;
  description: string;
  finalDate: bigint;
  startingDate: bigint;
  proposer: string;
  positive: Vote[];
  negative: Vote[];
}

const formatVotes = (data) =>
  data.map((v) => ({
    voter: v[0],
    stakeAmount: BigInt(v[1]),
  }));

const format = (data) =>
  data.map((p: any) => ({
    id: BigInt(p[0]),
    title: p[1],
    description: p[2],
    finalDate: BigInt(p[3]),
    startingDate: BigInt(p[4]),
    proposer: p[5],
    positive: formatVotes(p[6]),
    negative: formatVotes(p[7]),
  }));

export default function ProposalsList() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const { contract, account } = useWeb3();

  useEffect(() => {
    (!account
      ? new ethers.Contract(
          daoAddress,
          contractArtifact.abi,
          new ethers.JsonRpcProvider(provider),
        )
      : contract
    )
      ?.getProposals()
      .then(format)
      .then(setProposals);
  }, [contract, account]);

  return (
    <div className="min-h-dvh grid grid-rows-[min-content_1fr] h-full">
      <Header />
      <div className="bg-linear-to-t from-cyan-900 to-gray-900 fixed top-0 z-1 h-full w-full" />
      <main className="container grid grid-rows-[min-content_1fr] mx-auto z-2 h-full pt-10 px-10">
        <div className="-ml-1 mb-4 text-4xl font-black h-13 font-semibold text-white mt-10 flex justify-between">
          <h1>Proposals</h1>
          <AddButton />
        </div>
        <div className="border-x shadow-3xl border-t border-gray-500 w-full bg-gray-900 rounded-xs">
          <div className="flex flex-col-reverse divide-gray-700 divide-y-1 divide-y-reverse px-6">
            {proposals.map((proposal) => (
              <Proposal {...proposal} key={proposal.id} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

const ClosePseudoButton = ({ close }: { close: () => void }) => (
  <button
    onClick={close}
    className="text-gray-600 absolute absolute -top-2 -right-10 text-base select-none"
  >
    [ <span className="text-red-500">x</span> ]
  </button>
);

export const AddButton = () => {
  const { account } = useWeb3();
  const [shown, setShowForm] = useState(false);

  const close = () => setShowForm(false);

  return (
    <>
      <button
        disabled={!account}
        className={`mt-1 px-6 grid place-items-center border-2 border-gray-400 rounded-xs`}
        onClick={() => setShowForm(true)}
      >
        <span className="text-base">Compose a proposal</span>
      </button>
      {shown && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-20 flex items-center justify-center z-50">
          <div className="relative min-w-75">
            <ProporsalForm />
            <ClosePseudoButton close={close} />
          </div>
        </div>
      )}
    </>
  );
};

type WithdrawButtonP = {
  votedPositivly: Vote | undefined;
  votedNegativly: Vote | undefined;
  id: bigint;
};

const WithdrawButton = ({
  id,
  votedNegativly,
  votedPositivly,
}: WithdrawButtonP) => {
  const { contract, account } = useWeb3();
  const voted = votedNegativly || votedPositivly;
  const [visible, setVisible] = useState(false);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    if (!voted || !contract || !account) return;

    const checkVisibility = async () => {
      const filter = contract.filters.StakeWithdrawn(id, account);
      const events = await contract.queryFilter(filter, 0, "latest");
      setVisible(events.length === 0);
    };

    checkVisibility();
  }, [voted, contract, id, account]);
  if (!voted) return null;
  if (!visible) return null;

  const withdraw = async () => {
    setBlocked(true);
    contract
      ?.withdraw(id)
      .then((tx) => tx.wait())
      .then(() => window.location.reload())
      .finally(() => setBlocked(false));
  };

  return (
    <button className={`${buttonStyle}`} disabled={blocked} onClick={withdraw}>
      <span className="scale-240 -mt-1">↑</span>
    </button>
  );
};

const buttonStyle = `w-9 h-9 grid place-items-center rounded-full border-2`;
type VotingButtonsP = {
  id: bigint;
  positive: Vote[];
  negative: Vote[];
  active: boolean;
};

const VotingButtons = ({ id, positive, negative, active }: VotingButtonsP) => {
  const { account } = useWeb3();

  const votedPositivly = positive.find((v) => v.voter === account);
  const votedNegativly = negative.find((v) => v.voter === account);
  const [vote, setVote] = useState<boolean | null>();

  useEffect(() => {
    setVote(votedPositivly ? true : votedNegativly ? false : null);
  }, [votedPositivly, votedNegativly]);

  const [open, setOpen] = useState(false);

  const disabled = !account || vote !== null;

  const close = () => {
    setOpen(false);
    setVote(null);
  };

  return (
    <div className="grid grid-cols-2 gap-3 items-center">
      {!active && (
        <WithdrawButton
          id={id}
          votedNegativly={votedNegativly}
          votedPositivly={votedPositivly}
        />
      )}
      {!(vote !== null && vote === false) && (
        <button
          disabled={disabled}
          className={`col-start-1 col-end-2 row-start-1 row-end-2 ${buttonStyle} border-green-800 ${vote === true ? "bg-green-800 text-gray-900" : "text-green-800"}`}
          onClick={() => {
            setOpen(true);
            setVote(true);
          }}
        >
          <For />
        </button>
      )}
      {!(vote !== null && vote === true) && (
        <button
          disabled={disabled}
          className={`col-start-2 col-end-3 row-start-1 row-end-2 ${buttonStyle} border-red-800  ${vote === false ? "bg-red-800 text-gray-900" : "text-red-800"}`}
          onClick={() => {
            setOpen(true);
            setVote(false);
          }}
        >
          <Against />
        </button>
      )}
      {open && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-20 flex items-center justify-center z-50">
          <div className="relative min-w-75">
            <VotingForm vote={vote!} close={close} id={id} />
            <ClosePseudoButton close={close} />
          </div>
        </div>
      )}
    </div>
  );
};

const Proposal = (p: Proposal) => {
  const {
    title,
    description,
    positive,
    negative,
    proposer,
    startingDate,
    finalDate,
  } = p;

  const now = BigInt(Math.floor(Date.now() / 1000));
  const active = finalDate > now;
  console.log(startingDate, finalDate, now);

  return (
    <div className="py-3.5 text-white">
      <div className="flex justify-between">
        <div>
          <h2 className="text-lg font-semibold flex gap-2 items-center">
            <div
              className={`size-2 rounded-full ${active ? "bg-green-700" : "bg-gray-600"}`}
            />
            <span>{title}</span>
          </h2>
          <div className="text-gray-500 text-xs flex gap-3">
            <span>By: {proposer}</span>
            <span>Started: {convertUint256ToDate(startingDate)}</span>
            <span>Finishes: {convertUint256ToDate(finalDate)}</span>
          </div>
          <p className="text-gray-300 mt-3">{description}</p>
        </div>
        <div className="flex gap-10 items-start">
          <div className="ml-4 w-20">
            <VotingButtons
              id={p.id}
              active={active}
              positive={positive}
              negative={negative}
            />
            <Scale positive={positive} negative={negative} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Scale = ({
  positive,
  negative,
}: {
  positive: Vote[];
  negative: Vote[];
}) => {
  const forVotes =
    positive.reduce((acc, v) => acc + Number(v.stakeAmount), 0) /
    1000000000000000000;
  const againstVotes =
    negative.reduce((acc, v) => acc + Number(v.stakeAmount), 0) /
    1000000000000000000;
  const totalVotes = forVotes + againstVotes;
  const forPercentage = totalVotes ? (forVotes / totalVotes) * 100 : 1;
  const againstPercentage = totalVotes ? (againstVotes / totalVotes) * 100 : 1;

  return (
    <div className="mt-4">
      <div className="relative w-full h-1 bg-gray-700 rounded-lg overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-green-800"
          style={{ width: `${forPercentage}%` }}
        />
        <div
          className="absolute top-0 right-0 h-full bg-red-800"
          style={{ width: `${againstPercentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1 text-gray-400">
        <span>{Math.floor(forVotes)}</span>
        <span>{Math.floor(againstVotes)}</span>
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
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="m5 13l4 4L19 7"
    ></path>
  </svg>
);

const Against = () => (
  <svg viewBox="0 0 24 24" width="20px" height="20px">
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M6 18L18 6M6 6l12 12"
    ></path>
  </svg>
);
