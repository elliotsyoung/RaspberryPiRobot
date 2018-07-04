import time
from servosix import ServoSix
import sys
ss = ServoSix()


servo = int(sys.argv[1])
angle = int(sys.argv[2])
ss.set_servo(servo, angle)
