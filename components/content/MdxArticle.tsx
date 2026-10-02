import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export function MdxArticle({ source }: { source: string }) {
  return <div className="prose-lab text-sm"><MDXRemote source={source} options={{ mdxOptions: { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] } }} /></div>;
}
