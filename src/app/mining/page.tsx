import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

const MINING_SOURCES = [
  { id: 1, name: 'FreeMinerX', description: 'Simulated free bitcoin miner source #1' },
  { id: 2, name: 'CryptoMineNow', description: 'Simulated free bitcoin miner source #2' },
  { id: 3, name: 'BitMineHub', description: 'Simulated free bitcoin miner source #3' },
];

const walletAddressRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;

export default function MiningDashboard() {
  const [isMining, setIsMining] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [hashRate, setHashRate] = React.useState(0);
  const [totalMined, setTotalMined] = React.useState(0);
  const [customWallet, setCustomWallet] = React.useState('');
  const [message, setMessage] = React.useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Poll mining progress every 2 seconds when mining
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isMining) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/mining', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status' }),
          });
          if (res.ok) {
            const data = await res.json();
            setProgress(data.progress);
            setHashRate(data.hashRate);
            setTotalMined(data.totalMined);
          } else {
            setMessage({ type: 'error', text: 'Failed to fetch mining status.' });
          }
        } catch (error) {
          setMessage({ type: 'error', text: 'Error fetching mining status.' });
        }
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMining]);

  const startMining = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/mining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      if (res.ok) {
        setIsMining(true);
        setMessage({ type: 'success', text: 'Mining started.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to start mining.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error starting mining.' });
    }
    setIsLoading(false);
  };

  const stopMining = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/mining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
      if (res.ok) {
        setIsMining(false);
        setMessage({ type: 'success', text: 'Mining stopped.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to stop mining.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error stopping mining.' });
    }
    setIsLoading(false);
  };

  const deposit = async () => {
    setMessage(null);
    if (!walletAddressRegex.test(customWallet)) {
      setMessage({ type: 'error', text: 'Invalid Bitcoin wallet address.' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/mining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deposit', wallet: customWallet }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: data.message || 'Deposit successful.' });
        setTotalMined(0);
      } else {
        const errData = await res.json();
        setMessage({ type: 'error', text: errData.message || 'Deposit failed.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error during deposit.' });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center p-6">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Bitcoin Mining Dashboard</h1>
        <p className="text-gray-600">Mine bitcoin live and deposit to your Cash App wallet</p>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
            <Button onClick={startMining} disabled={isMining || isLoading} className="flex-1">
              Start Mining
            </Button>
            <Button onClick={stopMining} disabled={!isMining || isLoading} variant="destructive" className="flex-1">
              Stop Mining
            </Button>
            <Input
              placeholder="Enter your Bitcoin wallet address"
              value={customWallet}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomWallet(e.target.value)}
              className="flex-2"
              disabled={isLoading}
            />
            <Button onClick={deposit} disabled={isLoading || totalMined <= 0} className="flex-1">
              Deposit
            </Button>
          </div>
        </Card>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-4">
            {message.text}
          </Alert>
        )}

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Live Mining Progress</h2>
          <Progress value={progress} max={100} className="mb-2" />
          <p>Progress: {progress.toFixed(2)}%</p>
          <p>Hash Rate: {hashRate.toFixed(2)} H/s</p>
          <p>Total Mined: {totalMined.toFixed(8)} BTC</p>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Mining Sources</h2>
          <ul className="list-disc list-inside space-y-2">
            {MINING_SOURCES.map((source) => (
              <li key={source.id}>
                <strong>{source.name}</strong>: {source.description}
              </li>
            ))}
          </ul>
        </Card>
      </main>

      <footer className="mt-auto py-4 text-center text-sm text-gray-500">
        Created by marty m. with SandS Techs & More
      </footer>
    </div>
  );
}
