import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

export interface Porcion {
  id: string;
  nombre: string;
  valor: number;
  color: string;
}

export function Anillo({ datos, centro, onTocar }: { datos: Porcion[]; centro: React.ReactNode; onTocar?: (id: string) => void }) {
  return (
    <div className="relative h-52 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={datos} dataKey="valor" nameKey="nombre" innerRadius="68%" outerRadius="100%" paddingAngle={datos.length > 1 ? 2 : 0} stroke="none" isAnimationActive={false} onClick={(d) => onTocar?.((d as unknown as Porcion).id)}>
            {datos.map((d) => (
              <Cell key={d.id} fill={d.color} className="cursor-pointer outline-none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">{centro}</div>
    </div>
  );
}
