import React, { useState } from "react";
import { useWeb3 } from "./context";
import { convertDateToUint256 } from "./utils";
import { z } from "zod";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  finalDate: z
    .string()
    .min(1, { message: "Finish date is required" })
    .refine(
      (date) => {
        const inputDate = new Date(date);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        inputDate.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        return inputDate.getTime() >= tomorrow.getTime();
      },
      { message: "Finish date must be at least tomorrow" },
    ),
});

export const ProposalForm = () => {
  const { contract } = useWeb3();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    finalDate: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    finalDate: "",
  });

  // This handler works for all input fields because we're using the "name" attribute
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setFormData({ ...formData, [event.target.name]: event.target.value });

  const handleSubmit = async (event: React.FormEvent) => {
    setSubmitting(true);
    event.preventDefault();
    const result = formSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title ? fieldErrors.title[0] : "",
        description: fieldErrors.description ? fieldErrors.description[0] : "",
        finalDate: fieldErrors.finalDate ? fieldErrors.finalDate[0] : "",
      });
      return;
    }
    setErrors({ title: "", description: "", finalDate: "" });

    const final = {
      title: result.data.title,
      description: result.data.description,
      finalDate: convertDateToUint256(result.data.finalDate),
    };

    await contract?.createProposal(...Object.values(final));
    setSubmitting(false);

    window.location.reload();
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="text-base max-w-md mx-auto p-6 bg-black text-white border border-gray-600 shadow rounded-xs grid"
    >
      <h1 className="text-lg font-bold mb-1">Compose a proposal</h1>
      <p className="text-gray-400 mb-5 text-sm">
        Enter title, description, and finish date to compose a proposal
      </p>
      <div className="mb-4">
        <label htmlFor="title" className="block mb-2">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full py-2 px-3 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
        />
        {errors.title && (
          <p className="text-red-400 text-sm h-0 text-right">{errors.title}</p>
        )}
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="block mb-2">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full py-2 px-3 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
        />
        {errors.description && (
          <p className="text-red-400 text-sm h-0 text-right">
            {errors.description}
          </p>
        )}
      </div>
      <div className="mb-4">
        <label htmlFor="finalDate" className="block mb-2">
          Finish Date
        </label>
        <input
          type="date"
          name="finalDate"
          id="finalDate"
          value={formData.finalDate}
          onChange={handleChange}
          className="w-full py-2 px-3 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
        />
        {errors.finalDate && (
          <p className="text-red-400 text-sm h-0 text-right">
            {errors.finalDate}
          </p>
        )}
      </div>
      <button
        disabled={submitting}
        type="submit"
        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline self-center"
      >
        Submit
      </button>
    </form>
  );
};

export default ProposalForm;
