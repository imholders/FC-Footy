/* import React from "react";
// import { useCastGetRootQuery } from "../hooks/fhub/useCastGetRootQuery"; // <- adjust path as needed
import { useConversationTreeGetQuery } from "./fhub/useConversationTreeGetQuery";

const ExampleRootCast: React.FC = () => {
  const hash = "0x4ab7832ecd907494ddfce5802c0cec1c00430c5a";

const { data:cast, error, isLoading } = useConversationTreeGetQuery({
  args: {
    fid: 4163,
    hash: '0x4ab7832ecd907494ddfce5802c0cec1c00430c5a',
  },
});
  if (isLoading) return <div className="text-white">Loading cast...</div>;
  if (error) return <div className="text-red-500">Error loading cast</div>;
  if (!cast) return <div className="text-gray-500">No cast found</div>;

  return (
    <div className="p-4 bg-darkPurple text-white rounded">
      <div className="font-bold">@{cast.parent?.node.text.value}</div>
      <div>{cast.children.findLast.prototype}</div>
    </div>
  );
};

export default ExampleRootCast; */