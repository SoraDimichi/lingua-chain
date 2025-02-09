import React, { useState } from "react";
import { daoAddress, useWeb3 } from "./context";
import { z } from "zod";

const formSchema = z.object({
  range: z.number().min(1, { message: "Voting power must be at least 1" }),
});

type ProposalFormProps = {
  vote: boolean;
  id: bigint;
  close: () => void;
};

export const VotingForm = ({ vote, id }: ProposalFormProps) => {
  const { tokens, contract, tokensContract } = useWeb3();
  const [errors, setErrors] = useState({ range: "" });
  const [range, setRange] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (event: React.FormEvent) => {
    setSubmitting(true);
    event.preventDefault();
    const parsed = formSchema.safeParse({ range });
    if (!parsed.success) {
      setErrors({ range: parsed.error.flatten().fieldErrors.range?.[0] || "" });
      return;
    }
    setErrors({ range: "" });

    const real = BigInt(range * 1000000000000000000);

    await tokensContract
      ?.approve(daoAddress, BigInt(real))
      .then((tx) => tx.wait());
    await contract?.vote(id, vote, BigInt(real)).then((tx) => tx.wait());

    setSubmitting(false);

    window.location.reload();
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="text-base max-w-md mx-auto p-6 bg-black text-white border border-gray-600 shadow rounded-xs grid"
    >
      <h1 className="text-lg font-bold mb-1">Cast your vote</h1>
      <p className="text-gray-400 mb-5 text-sm">
        Choose your voting power and submit the vote
      </p>
      <div className="mb-4">
        <label htmlFor="choice" className="block mb-2 font-bold">
          Choice
        </label>
        {vote ? "For" : "Against"}
      </div>
      <div className="flex-col items-center mr-5 mb-10">
        <label htmlFor="votingPower" className="block mb-2 font-bold">
          Voting power
        </label>
        <input
          type="range"
          min="1"
          max={(Number(tokens) / 1000000000000000000).toString()}
          value={range}
          onChange={(event) => setRange(Number(event.target.value))}
          className="w-full h-2 bg-gray-900 rounded-lg appearance-none cursor-pointer"
        />
        <div className="ml-2 text-lg text-gray-200">{range}</div>
        {errors.range && (
          <p className="text-red-400 text-sm text-right">{errors.range}</p>
        )}
      </div>
      <button
        disabled={submitting}
        type="submit"
        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Submit
      </button>
    </form>
  );
};

export default VotingForm;
