import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card } from "./card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const meta = {
  title: "Components/Table",
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const KEYS = [
  { name: "Ingest-Pipeline", key: "jlu_a1b2…9f0e", created: "01.02.2026", used: "gestern", state: "aktiv" },
  { name: "Eval-Runner", key: "jlu_c3d4…71ac", created: "14.03.2026", used: "vor 3 Tagen", state: "aktiv" },
  { name: "Altes Widget", key: "jlu_e5f6…b220", created: "22.11.2025", used: "—", state: "abgelaufen" },
];

/**
 * Der Normalfall: eine dichte Datentabelle in einer `Card`. Zahlen- und
 * Aktionsspalten werden am Zellenaufruf rechtsbündig gesetzt (`text-right`),
 * die Kopfzeile ist ruhiger als der Inhalt (`on-surface-variant`).
 */
export const DataTable: Story = {
  render: () => (
    <Card className="max-w-3xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Schlüssel</TableHead>
            <TableHead>Erstellt</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {KEYS.map((k) => (
            <TableRow key={k.name}>
              <TableCell className="font-medium">{k.name}</TableCell>
              <TableCell>{k.key}</TableCell>
              <TableCell>{k.created}</TableCell>
              <TableCell>
                <Badge tone={k.state === "aktiv" ? "success" : "neutral"}>{k.state}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  Widerrufen
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  ),
};

/**
 * `TableCaption` benennt die Tabelle (zugänglicher Name, unten dargestellt),
 * `TableFooter` trägt die Summenzeile. Das `<caption>` steht im DOM als
 * **erstes** Kind des `<table>` — `caption-bottom` schiebt es optisch nach
 * unten.
 */
export const CaptionAndFooter: Story = {
  render: () => (
    <Card className="max-w-2xl">
      <Table>
        <TableCaption>Abrechnung März 2026 — alle Beträge netto.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Position</TableHead>
            <TableHead className="text-right">Anfragen</TableHead>
            <TableHead className="text-right">Betrag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Chat-Antworten</TableCell>
            <TableCell className="text-right">128.400</TableCell>
            <TableCell className="text-right">412,80 €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Dokument-Ingest</TableCell>
            <TableCell className="text-right">3.210</TableCell>
            <TableCell className="text-right">96,30 €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Evaluationsläufe</TableCell>
            <TableCell className="text-right">42</TableCell>
            <TableCell className="text-right">21,00 €</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Gesamt</TableCell>
            <TableCell className="text-right">530,10 €</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  ),
};

/**
 * Breite Tabellen scrollen in ihrem **eigenen** Container statt die Seite zu
 * sprengen — der Container gehört zu `Table`, es braucht kein `overflow-x-auto`
 * am Aufrufort. Der Rahmen hier ist absichtlich schmal, damit der Scrollbalken
 * sichtbar wird. Spalten, die nie umbrechen sollen (Datum, Zahlen), bekommen
 * `whitespace-nowrap` an der Zelle.
 */
export const WideScrolls: Story = {
  render: () => (
    <Card className="max-w-md">
      <Table>
        <TableCaption>Evaluationsläufe — 8 Spalten in einer schmalen Karte.</TableCaption>
        <TableHeader>
          <TableRow>
            {["Status", "Label", "Gestartet", "Dauer", "Wissensbasis", "Judge", "Recall", "Aktionen"].map((c) => (
              <TableHead key={c} className="whitespace-nowrap">
                {c}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <Badge tone="success">fertig</Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">Baseline v{i}</TableCell>
              <TableCell className="whitespace-nowrap">0{i}.04.2026 09:1{i}</TableCell>
              <TableCell className="whitespace-nowrap text-right">4m 1{i}s</TableCell>
              <TableCell className="whitespace-nowrap">Studienberatung</TableCell>
              <TableCell>ja</TableCell>
              <TableCell className="text-right">0,8{i}</TableCell>
              <TableCell className="whitespace-nowrap text-right">
                <Button variant="ghost" size="sm">
                  Öffnen
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  ),
};

/**
 * Vertikal scrollende Tabelle: die Höhe gehört an den Scroll-Container, nicht
 * an die Tabelle — dafür ist `containerClassName` da. (Ohne diesen Zugriff
 * wäre der „Low-Score-Queries"-Block im JustRAG-Dashboard nicht baubar.)
 * Eine mitlaufende Kopfzeile bringt `Table` bewusst noch **nicht** mit,
 * siehe „Bewusst nicht enthalten" in der Doku.
 */
export const BoundedHeightScrolls: Story = {
  render: () => (
    <Card className="max-w-xl">
      <Table containerClassName="max-h-56">
        <TableHeader>
          <TableRow>
            <TableHead>Anfrage</TableHead>
            <TableHead className="text-right whitespace-nowrap">Ø Score</TableHead>
            <TableHead className="text-right whitespace-nowrap">Datum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 12 }, (_, i) => (
            <TableRow key={i}>
              <TableCell>Wie melde ich mich für die Klausur im Modul {i + 1} an?</TableCell>
              <TableCell className="text-right">0,{20 + i}</TableCell>
              <TableCell className="whitespace-nowrap text-right">0{(i % 9) + 1}.03.2026</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  ),
};

/**
 * Leerzustand: eine einzelne Zeile mit `colSpan` über alle Spalten. Die
 * Kopfzeile bleibt stehen, damit die Struktur der Tabelle lesbar bleibt —
 * ein leeres `<tbody>` wäre für Screenreader eine Tabelle ohne Aussage.
 */
export const Empty: Story = {
  render: () => (
    <Card className="max-w-2xl">
      <Table>
        <TableCaption>Zugriffsschlüssel</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Schlüssel</TableHead>
            <TableHead>Erstellt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={3} className="py-8 text-center text-on-surface-variant">
              Noch kein Schlüssel angelegt.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  ),
};

/**
 * Markdown-Tabelle: beliebiger Inhalt, schmale Spalte. Zellen umbrechen von
 * Haus aus, lange ungetrennte Zeichenketten (Hashes, URLs) brechen per
 * `wrap-anywhere` innerhalb der Zelle statt die Tabelle zu sprengen.
 */
export const ArbitraryContent: Story = {
  render: () => (
    <Card className="max-w-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quelle</TableHead>
            <TableHead>Fundstelle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <a className="text-primary underline" href="https://www.uni-giessen.de">
                Prüfungsordnung 2024
              </a>
            </TableCell>
            <TableCell>
              § 12 Abs. 3 — die Anmeldung erfolgt ausschließlich elektronisch und
              muss spätestens zwei Wochen vor dem Prüfungstermin vorliegen.
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Dokument-Hash</TableCell>
            <TableCell>c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  ),
};
