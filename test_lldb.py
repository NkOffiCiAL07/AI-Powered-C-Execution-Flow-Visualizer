#!/usr/bin/env python3
import pexpect
import re

try:
    p = pexpect.spawn('lldb', ['--no-lldbinit', 'demo/demo_program'], encoding='utf-8', timeout=5, echo=False)
    p.expect_exact('(lldb)')
    print('LLDB started successfully')
    
    p.sendline('settings set use-color false')
    p.expect_exact('(lldb)')
    
    p.sendline('settings set auto-confirm true')
    p.expect_exact('(lldb)')
    
    # Set breakpoint
    p.sendline('breakpoint set --name main')
    p.expect_exact('(lldb)')
    print('Breakpoint set')
    
    # Run
    p.sendline('run')
    p.expect_exact('(lldb)', timeout=10)
    print('Program ran')
    
    # Get location
    p.sendline('frame info')
    p.expect_exact('(lldb)')
    print('Got frame info')
    
    # Get variables
    p.sendline('frame variable')
    p.expect_exact('(lldb)')
    print('Got variables')
    
    # Step
    p.sendline('thread step-over')
    p.expect_exact('(lldb)')
    print('Stepped over')
    
    p.terminate(force=True)
    print('Success!')
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()
