import { Spinner } from '@/components/Spinner';
import { useParliament } from '@/services/parliament/useParliament';
import { Table } from '@radix-ui/themes';
import { useMemo, useState } from 'react';
import { FaSearch, FaUserTie } from 'react-icons/fa';
import { PieChart } from 'react-minimal-pie-chart';

const ParliamentList = () => {
  const { parliament, metadata, isLoading, isError, error } = useParliament();
  const [filterText, setFilterText] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedParty, setSelectedParty] = useState<string>('');

  // Memoize filtered MPs
  const filteredMPs = useMemo(() => {
    if (!parliament?.Deputados) return [];
    return parliament.Deputados.filter((mp) => {
      const matchesSearch =
        mp.DepNomeCompleto.toLowerCase().includes(filterText.toLowerCase()) ||
        mp.DepNomeParlamentar.toLowerCase().includes(filterText.toLowerCase());
      const matchesDistrict = selectedDistrict
        ? mp.DepCPDes === selectedDistrict
        : true;
      const matchesParty = selectedParty
        ? mp.DepGP[mp.DepGP.length - 1]?.gpSigla === selectedParty
        : true;
      return matchesSearch && matchesDistrict && matchesParty;
    });
  }, [parliament?.Deputados, filterText, selectedDistrict, selectedParty]);

  // Get unique parties for filter
  const parties = useMemo(() => {
    if (!parliament?.Deputados) return [];
    const partySet = new Set<string>();
    for (const mp of parliament.Deputados) {
      const currentParty = mp.DepGP[mp.DepGP.length - 1]?.gpSigla;
      if (currentParty) {
        partySet.add(currentParty);
      }
    }
    return Array.from(partySet).sort();
  }, [parliament?.Deputados]);

  // Get districts for filter
  const districts = useMemo(() => {
    if (!parliament?.CirculosEleitorais) return [];
    return parliament.CirculosEleitorais.sort((a, b) =>
      a.cpDes.localeCompare(b.cpDes),
    );
  }, [parliament?.CirculosEleitorais]);

  // Generate chart data
  const partyChartData = useMemo(() => {
    if (!metadata?.totalByParty) return [];
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEEAD',
      '#D4A5A5',
      '#9B59B6',
      '#3498DB',
      '#E67E22',
      '#2ECC71',
    ];

    return Object.entries(metadata.totalByParty).map(
      ([party, count], index) => ({
        title: party,
        value: count,
        color: colors[index % colors.length],
      }),
    );
  }, [metadata?.totalByParty]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-600 text-center">
          <h2 className="text-xl font-bold mb-2">
            Error loading parliament data
          </h2>
          <p>
            {error instanceof Error
              ? error.message
              : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-5 overflow-hidden">
      <div className="flex-none">
        <h1 className="text-2xl font-bold mb-4">Parliament Members</h1>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Party Distribution</h2>
            <div className="h-64">
              <PieChart
                data={partyChartData}
                label={({ dataEntry }) =>
                  `${dataEntry.title} (${Math.round(dataEntry.percentage)}%)`
                }
                labelStyle={{ fontSize: '4px' }}
                labelPosition={80}
                animate
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div>
                <p className="text-neutral-600">Total MPs</p>
                <p className="text-2xl font-bold">{metadata?.total || 0}</p>
              </div>
              <div>
                <p className="text-neutral-600">Electoral Districts</p>
                <p className="text-2xl font-bold">{districts.length}</p>
              </div>
              <div>
                <p className="text-neutral-600">Political Parties</p>
                <p className="text-2xl font-bold">{parties.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search MPs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-neutral-6 bg-neutral-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              aria-label="Search MPs"
            />
            <FaSearch
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-11"
              aria-hidden="true"
            />
          </div>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-4 py-2 rounded-lg border border-neutral-6 bg-neutral-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            aria-label="Filter by district"
          >
            <option value="">All Districts</option>
            {districts.map((district) => (
              <option key={district.cpId} value={district.cpDes}>
                {district.cpDes}
              </option>
            ))}
          </select>
          <select
            value={selectedParty}
            onChange={(e) => setSelectedParty(e.target.value)}
            className="px-4 py-2 rounded-lg border border-neutral-6 bg-neutral-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            aria-label="Filter by party"
          >
            <option value="">All Parties</option>
            {parties.map((party) => (
              <option key={party} value={party}>
                {party}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MPs Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table.Root>
            <Table.Header>
              <Table.Row className="bg-neutral-2">
                <Table.ColumnHeaderCell scope="col" />
                <Table.ColumnHeaderCell scope="col">
                  Name
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col">
                  District
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col">
                  Party
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col">
                  Status
                </Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {filteredMPs.length === 0 ? (
                <Table.Row>
                  <Table.Cell
                    colSpan={5}
                    className="text-center py-8 text-neutral-11"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FaUserTie className="w-6 h-6" aria-hidden="true" />
                      <p>
                        {filterText || selectedDistrict || selectedParty
                          ? 'No MPs found matching your criteria.'
                          : 'No MPs available.'}
                      </p>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredMPs.map((mp) => (
                  <Table.Row
                    key={mp.DepId}
                    className="hover:bg-neutral-1 transition-colors"
                  >
                    <Table.Cell>
                      <FaUserTie className="text-neutral-11" />
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <div className="font-medium">
                          {mp.DepNomeParlamentar}
                        </div>
                        <div className="text-sm text-neutral-11">
                          {mp.DepNomeCompleto}
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>{mp.DepCPDes}</Table.Cell>
                    <Table.Cell>
                      <span className="inline-flex px-2 py-1 rounded-full text-sm bg-neutral-2">
                        {mp.DepGP[mp.DepGP.length - 1]?.gpSigla}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="inline-flex px-2 py-1 rounded-full text-sm bg-neutral-2">
                        {mp.DepSituacao[mp.DepSituacao.length - 1]?.sioDes}
                      </span>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </div>
      </div>
    </div>
  );
};

export default ParliamentList;
