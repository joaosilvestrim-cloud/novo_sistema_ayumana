import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";

/**
 * Renderiza markdown (e HTML embutido) com o estilo Ayumana.
 * rehype-raw permite conteúdo importado em HTML — usar só com conteúdo confiável
 * (autoria do admin / migração), nunca com input de usuário anônimo.
 */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("prose-ayumana", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
