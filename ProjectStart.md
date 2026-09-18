## Start Backend Server:

```bash
py -3.12 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger documentation: http://127.0.0.1:8000/docs

## Start Frontend Dashboard:

```bash
cd frontend
npm run dev
```
Dispatch Dashboard: http://localhost:5173