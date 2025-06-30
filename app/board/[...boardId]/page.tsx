import BoardCanvas from '@/components/BoardCanvas';
import BoardComponent from '@/components/Boards';

export default async function Board({ params }: any ) {
  const { boardId } = params;
  const id = boardId[0];

  return (
    <div>
      <BoardCanvas boardId={id}/>
      <BoardComponent defaultOpen = {false} />
    </div>
  );
}