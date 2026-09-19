import React from "react";

export function HairlineTable({
  children,
  className = "",
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={`w-full text-left border-y border-[#e5e2d9] font-sans text-sm ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function HairlineTableHead({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`border-b border-[#e5e2d9] font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#78746d] ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function HairlineTableBody({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-[#e5e2d9]/60 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function HairlineTableRow({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`transition-colors duration-150 hover:bg-[#faf9f6] group ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function HairlineTableCell({
  children,
  className = "",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`py-3 px-4 text-[#171615] align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}

export function HairlineTableHeadCell({
  children,
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`py-3 px-4 font-semibold tracking-[0.08em] ${className}`} {...props}>
      {children}
    </th>
  );
}
