export const convertDateToUint256 = (dateStr: string) =>
  BigInt(Math.floor(new Date(dateStr).getTime() / 1000));

export const convertUint256ToDate = (timestamp: bigint) =>
  new Date(Number(timestamp) * 1000).toISOString().split("T")[0];
