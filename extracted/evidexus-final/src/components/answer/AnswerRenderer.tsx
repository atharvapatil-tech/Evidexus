import type { SearchMode } from "@/lib/searchModes";
import QAAnswer from "./QAAnswer";
import LiteratureAnswer from "./LiteratureAnswer";
import CompareAnswer from "./CompareAnswer";
import InteractionsAnswer from "./InteractionsAnswer";
import VerifyRxAnswer from "./VerifyRxAnswer";

type Props = { mode: SearchMode; data: any };

const AnswerRenderer = ({ mode, data }: Props) => {
  switch (mode) {
    case "qa":
      return <QAAnswer data={data} />;
    case "literature":
      return <LiteratureAnswer data={data} />;
    case "compare":
      return <CompareAnswer data={data} />;
    case "interactions":
      return <InteractionsAnswer data={data} />;
    case "verify":
      return <VerifyRxAnswer data={data} />;
    default:
      return null;
  }
};

export default AnswerRenderer;
