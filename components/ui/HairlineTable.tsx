import React from "react";

export function HairlineTable({
  children,
  className = "",
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={`w-full text-left border-y border-[var(--border-hairline)] font-sans text-sm ${className}`}
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
      className={`border-b border-[var(--border-hairline)] font-mono text-xs uppercase tracking-[0.02em] text-[var(--text-secondary)] ${className}`}
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
    <tbody
      className={`divide-y divide-[var(--border-hairline)] ${className}`}
      {...props}
    >
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
      className={`transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] hover:bg-[var(--bg-elevated)] group ${className}`}
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
    <td
      className={`py-3 px-4 text-[var(--text-primary)] align-middle ${className}`}
      {...props}
    >
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
    <th
      className={`py-3 px-4 font-normal align-middle ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}
