import re,sys
text=open(sys.argv[1],encoding="utf-8").read()
found=set(re.findall(r"uses-permission[^:]*:.*?name='([^']+)'",text))
allowed={"android.permission.INTERNET","android.permission.ACCESS_NETWORK_STATE","android.permission.WAKE_LOCK","com.shihab.funwithflags.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"}
extra=found-allowed
if extra:raise SystemExit("Unexpected APK permissions: "+", ".join(sorted(extra)))
print("PASS: only the expected network/wake and app-local signature permissions are declared.")
